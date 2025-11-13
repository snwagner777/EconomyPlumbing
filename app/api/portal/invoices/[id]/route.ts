import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

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
 * GET /api/portal/invoices/[id]
 * Fetch detailed invoice with line items
 */
export async function GET(
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

    console.log(`[Portal Invoice Detail] Fetching invoice ${invoiceId} for customer ${session.customerId}`);

    // Fetch invoice details from ServiceTitan
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
      console.error(`[Portal Invoice Detail] Security violation: Customer ${session.customerId} attempted to access invoice ${invoiceId} for customer ${invoice.customerId}`);
      return NextResponse.json(
        { error: 'Unauthorized - This invoice does not belong to you' },
        { status: 403 }
      );
    }

    // Transform invoice to consistent format with line items
    const invoiceDetail = {
      id: invoice.id,
      number: invoice.invoiceNumber || invoice.number || `INV-${invoice.id}`,
      date: invoice.createdOn || invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status || 'Unknown',
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      total: invoice.total || 0,
      balance: invoice.balance || 0,
      jobId: invoice.jobId,
      jobNumber: invoice.job?.number || invoice.jobNumber,
      locationId: invoice.locationId,
      customerId: invoice.customerId,
      summary: invoice.summary || invoice.job?.summary,
      items: (invoice.items || []).map((item: any) => ({
        id: item.id,
        type: item.type || 'Service',
        skuName: item.skuName || item.description || 'Unknown',
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || item.unitPrice || 0,
        total: item.total || (item.price * item.quantity) || 0,
        memberPrice: item.memberPrice,
      })),
    };

    console.log(`[Portal Invoice Detail] Retrieved invoice ${invoiceId} with ${invoiceDetail.items.length} items`);

    return NextResponse.json(invoiceDetail);
  } catch (error: any) {
    console.error('[Portal Invoice Detail] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load invoice details' },
      { status: 500 }
    );
  }
}
