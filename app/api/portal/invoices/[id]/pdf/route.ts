import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { db } from '@/server/db';
import { contactSubmissions } from '@shared/schema';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

/**
 * POST /api/portal/invoices/[id]/pdf
 * Request PDF download for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Valid invoice ID required' },
        { status: 400 }
      );
    }

    // SECURITY: Validate session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Fetch invoice to verify ownership and get details
    const tenantId = serviceTitanAuth.getTenantId();
    const invoice = await serviceTitanAuth.makeRequest<any>(
      `accounting/v2/tenant/${tenantId}/invoices/${invoiceId}`
    );

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify invoice belongs to customer
    if (invoice.customerId !== session.customerId) {
      console.error(`[Portal Invoice PDF] Security violation: Customer ${session.customerId} attempted to access invoice PDF ${invoiceId} for customer ${invoice.customerId}`);
      return NextResponse.json(
        { error: 'Unauthorized - This invoice does not belong to you' },
        { status: 403 }
      );
    }

    const invoiceNumber = invoice.invoiceNumber || invoice.number || `INV-${invoice.id}`;

    console.log(`[Portal Invoice PDF] PDF request for invoice ${invoiceNumber} from customer ${session.customerId}`);

    // Parse customer details from request body
    const body = await request.json();
    const { customerName, customerEmail } = body;

    // Log PDF request to database
    await db.insert(contactSubmissions).values({
      name: customerName || 'Unknown',
      phone: 'PDF Request',
      email: customerEmail || 'no-email',
      service: `PDF Request: Invoice ${invoiceNumber}`,
      message: `Customer ID: ${session.customerId}\nType: Invoice\nNumber: ${invoiceNumber}\nID: ${invoiceId}\n\nPDF requested via Customer Portal`,
      pageContext: 'Customer Portal - Invoice PDF',
    });

    console.log(`[Portal Invoice PDF] PDF request logged for invoice ${invoiceNumber}`);

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'cdd5d54b6e6c4413@teamchat.zoom.us';
      const { sendEmail } = await import('@/server/email');

      const subject = `Customer Portal: Invoice PDF Request for ${invoiceNumber}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8;">Invoice PDF Request from Customer Portal</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Type:</strong> Invoice</p>
            <p><strong>Number:</strong> ${invoiceNumber}</p>
            <p><strong>ID:</strong> ${invoiceId}</p>
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Customer Information</h3>
            <p><strong>Customer ID:</strong> ${session.customerId}</p>
            <p><strong>Name:</strong> ${customerName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please send the invoice PDF to the customer.</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: adminEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[Portal Invoice PDF] Email notification sent to ${adminEmail} for invoice ${invoiceNumber}`);
    } catch (emailError: any) {
      console.warn(`[Portal Invoice PDF] Email notification failed (request still logged): ${emailError.message}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'PDF request submitted successfully. You will receive it via email shortly.'
    });
  } catch (error: any) {
    console.error('[Portal Invoice PDF] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request invoice PDF' },
      { status: 500 }
    );
  }
}
