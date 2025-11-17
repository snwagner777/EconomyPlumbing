import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';
import { contactSubmissions } from '@shared/schema';

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    // SECURITY: Validate session first
    const { customerId: sessionCustomerId, availableCustomerIds } = await getPortalSession();
    
    const { type, number, id, customerId, customerName, customerEmail } = await req.json();

    if (!type || !number || !id || !customerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // SECURITY: Verify customer owns this resource
    const requestedCustomerId = parseInt(customerId);
    assertCustomerOwnership(requestedCustomerId, availableCustomerIds);

    console.log(`[Portal] PDF request received: ${type} #${number} for customer ${customerId}`);
    console.log(`[Portal] Customer details - Name: ${customerName}, Email: ${customerEmail}`);
    console.log(`[Portal] Request authorized for customer ${sessionCustomerId}`);

    // Create a simple log entry in the database
    await db.insert(contactSubmissions).values({
      name: customerName || 'Unknown',
      phone: 'PDF Request',
      email: customerEmail || 'no-email',
      service: `PDF Request: ${type} #${number}`,
      message: `Customer ID: ${customerId}\nType: ${type}\nNumber: ${number}\nID: ${id}\n\nPDF requested via Customer Portal`,
      pageContext: 'Customer Portal - PDF Request',
    });
    
    console.log(`[Portal] PDF request logged to database for ${type} #${number}`);

    // Try to send email notification if configured
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'cdd5d54b6e6c4413@teamchat.zoom.us';
      
      const { sendEmail } = await import('@/server/email');
      
      const subject = `Customer Portal: PDF Request for ${type} #${number}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8;">PDF Request from Customer Portal</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
            <p><strong>Number:</strong> ${number}</p>
            <p><strong>ID:</strong> ${id}</p>
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Customer Information</h3>
            <p><strong>Customer ID:</strong> ${customerId}</p>
            <p><strong>Name:</strong> ${customerName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please send the PDF for this ${type} to the customer.</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: adminEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[Portal] PDF request email sent to ${adminEmail} for ${type} #${number}`);
    } catch (emailError: any) {
      // Email failed but request was logged - still return success
      console.warn(`[Portal] Email notification failed (request still logged): ${emailError.message}`);
      console.log(`[Portal] PDF request saved to database despite email failure`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Portal] PDF request error:", error);
    
    // Handle session errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: "Unauthorized - This document does not belong to you" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process PDF request" },
      { status: 500 }
    );
  }
}
