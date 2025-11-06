import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    const { estimateId, estimateNumber } = await req.json();

    if (!estimateId || !estimateNumber) {
      return NextResponse.json(
        { error: 'Estimate ID and number required' },
        { status: 400 }
      );
    }

    console.log(`[Estimate Acceptance] Customer ${session.customerId} accepting estimate ${estimateNumber}`);

    // Get ServiceTitan API
    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();

    // CRITICAL SECURITY CHECK: Verify estimate belongs to authenticated customer
    let estimate;
    try {
      const customerEstimates = await serviceTitan.getCustomerEstimates(session.customerId);
      estimate = customerEstimates.find((e: any) => e.id === estimateId);
      
      if (!estimate) {
        console.warn(`[Estimate Acceptance] Unauthorized attempt: Customer ${session.customerId} tried to accept estimate ${estimateId} which doesn't belong to them`);
        return NextResponse.json(
          { error: 'Estimate not found or does not belong to you' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('[Estimate Acceptance] Error verifying estimate ownership:', error);
      return NextResponse.json(
        { error: 'Failed to verify estimate ownership' },
        { status: 500 }
      );
    }

    // Mark estimate as sold in ServiceTitan
    // ServiceTitan Estimates API v2 - update estimate status to sold
    const soldDate = new Date().toISOString();
    
    try {
      // Call ServiceTitan API to mark estimate as sold
      await serviceTitan.markEstimateAsSold(estimateId, soldDate);
      
      console.log(`[Estimate Acceptance] Successfully marked estimate ${estimateNumber} as sold`);
    } catch (stError: any) {
      console.error('[Estimate Acceptance] ServiceTitan API error:', stError);
      return NextResponse.json(
        { error: 'Failed to accept estimate in ServiceTitan' },
        { status: 500 }
      );
    }

    // Send email notification to admin/team
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Get customer data for email
      const customer = await serviceTitan.getCustomer(session.customerId);
      
      await resend.emails.send({
        from: 'Economy Plumbing <noreply@plumbersthatcare.com>',
        to: process.env.ADMIN_EMAIL || 'admin@plumbersthatcare.com',
        subject: `🎉 Estimate Accepted: #${estimateNumber}`,
        html: `
          <h2>Customer Accepted Estimate</h2>
          <p>A customer has accepted an estimate through the customer portal and is ready to schedule service!</p>
          
          <h3>Estimate Details:</h3>
          <ul>
            <li><strong>Estimate #:</strong> ${estimateNumber}</li>
            <li><strong>Estimate ID:</strong> ${estimateId}</li>
            <li><strong>Accepted:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          
          <h3>Customer Information:</h3>
          <ul>
            <li><strong>Name:</strong> ${customer?.name || 'Unknown'}</li>
            <li><strong>Customer ID:</strong> ${session.customerId}</li>
            <li><strong>Phone:</strong> ${customer?.phoneNumber || 'N/A'}</li>
            <li><strong>Email:</strong> ${customer?.email || 'N/A'}</li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Contact the customer to schedule the work</li>
            <li>Verify the estimate details in ServiceTitan</li>
            <li>Coordinate technician availability</li>
          </ul>
          
          <p><a href="https://go.servicetitan.com/#/Estimate/Index/${estimateId}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Estimate in ServiceTitan</a></p>
        `,
      });

      console.log('[Estimate Acceptance] Admin notification email sent');
    } catch (emailError: any) {
      console.error('[Estimate Acceptance] Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const customer = await serviceTitan.getCustomer(session.customerId);
      
      if (customer?.email) {
        await resend.emails.send({
          from: 'Economy Plumbing <noreply@plumbersthatcare.com>',
          to: customer.email,
          subject: `Estimate #${estimateNumber} Accepted - We'll Be In Touch!`,
          html: `
            <h2>Thank You for Accepting Your Estimate!</h2>
            <p>Hi ${customer.name},</p>
            
            <p>We've received your acceptance of Estimate #${estimateNumber}. Our team will contact you shortly to schedule the work at a time that's convenient for you.</p>
            
            <h3>What Happens Next:</h3>
            <ol>
              <li>Our scheduling team will call you within 1 business day</li>
              <li>We'll find a convenient time for the service</li>
              <li>We'll send you a confirmation with the appointment details</li>
            </ol>
            
            <p>If you have any questions or need to reach us sooner, please call <strong>${process.env.BUSINESS_PHONE || '(512) 259-7222'}</strong>.</p>
            
            <p>Thank you for choosing Economy Plumbing Services!</p>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px;">
              Economy Plumbing Services<br>
              Austin's Trusted Plumbing Experts<br>
              ${process.env.BUSINESS_PHONE || '(512) 259-7222'}
            </p>
          `,
        });

        console.log('[Estimate Acceptance] Customer confirmation email sent');
      }
    } catch (emailError: any) {
      console.error('[Estimate Acceptance] Customer email failed:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Estimate accepted successfully. Our team will contact you soon to schedule the work!'
    });

  } catch (error: any) {
    console.error('[Estimate Acceptance] Error:', error);
    return NextResponse.json(
      { error: 'Failed to accept estimate' },
      { status: 500 }
    );
  }
}
