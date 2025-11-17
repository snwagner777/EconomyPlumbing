import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanEstimates } from '@/server/lib/servicetitan/estimates';
import { contactSubmissions } from '@shared/schema';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

/**
 * POST /api/portal/estimates/[id]/pdf
 * Request PDF download for an estimate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { db } = await import('@/server/db');
  try {
    const { id } = await params;
    const estimateId = parseInt(id, 10);

    if (isNaN(estimateId)) {
      return NextResponse.json(
        { error: 'Valid estimate ID required' },
        { status: 400 }
      );
    }

    // SECURITY: Validate session
    const { customerId, availableCustomerIds } = await getPortalSession();

    // Fetch estimate to verify ownership and get details
    const estimate = await serviceTitanEstimates.getEstimateById(estimateId);

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify estimate belongs to authorized customer
    assertCustomerOwnership(estimate.customerId, availableCustomerIds);

    const estimateNumber = estimate.estimateNumber;

    console.log(`[Portal Estimate PDF] PDF request for estimate ${estimateNumber} from customer ${customerId}`);

    // Parse customer details from request body
    const body = await request.json();
    const { customerName, customerEmail } = body;

    // Log PDF request to database
    await db.insert(contactSubmissions).values({
      name: customerName || 'Unknown',
      phone: 'PDF Request',
      email: customerEmail || 'no-email',
      service: `PDF Request: Estimate ${estimateNumber}`,
      message: `Customer ID: ${customerId}\nType: Estimate\nNumber: ${estimateNumber}\nID: ${estimateId}\n\nPDF requested via Customer Portal`,
      pageContext: 'Customer Portal - Estimate PDF',
    });

    console.log(`[Portal Estimate PDF] PDF request logged for estimate ${estimateNumber}`);

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'cdd5d54b6e6c4413@teamchat.zoom.us';
      const { sendEmail } = await import('@/server/email');

      const subject = `Customer Portal: Estimate PDF Request for ${estimateNumber}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8;">Estimate PDF Request from Customer Portal</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Type:</strong> Estimate</p>
            <p><strong>Number:</strong> ${estimateNumber}</p>
            <p><strong>ID:</strong> ${estimateId}</p>
            <p><strong>Status:</strong> ${estimate.status}</p>
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Customer Information</h3>
            <p><strong>Customer ID:</strong> ${customerId}</p>
            <p><strong>Name:</strong> ${customerName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please send the estimate PDF to the customer.</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: adminEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[Portal Estimate PDF] Email notification sent to ${adminEmail} for estimate ${estimateNumber}`);
    } catch (emailError: any) {
      console.warn(`[Portal Estimate PDF] Email notification failed (request still logged): ${emailError.message}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'PDF request submitted successfully. You will receive it via email shortly.'
    });
  } catch (error: any) {
    console.error('[Portal Estimate PDF] Error:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Unauthorized - This estimate does not belong to you' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to request estimate PDF' },
      { status: 500 }
    );
  }
}
