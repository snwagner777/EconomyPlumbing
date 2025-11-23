import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

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
    const { customerId, availableCustomerIds } = await getPortalSession();

    console.log(`[Portal Invoice Detail] Fetching invoice ${invoiceId} for customer ${customerId}`);

    // Fetch invoice details from ServiceTitan
    // NOTE: ServiceTitan v2 doesn't support GET /invoices/{id} endpoint
    // We need to fetch all invoices for the customer and filter by ID
    const tenantId = serviceTitanAuth.getTenantId();
    
    // Fetch all customer invoices (will be cached/fast for repeat requests)
    const endpoint = `accounting/v2/tenant/${tenantId}/invoices?customerId=${customerId}&pageSize=100`;
    console.log(`[Portal Invoice Detail] Fetching invoices for customer ${customerId} to find invoice ${invoiceId}`);
    
    const response = await serviceTitanAuth.makeRequest<any>(endpoint);
    const invoices = response?.data || [];
    
    // Find the specific invoice by ID
    const invoice = invoices.find((inv: any) => inv.id === invoiceId);

    if (!invoice) {
      // Check if invoice might belong to a different customer account
      for (const altCustomerId of availableCustomerIds) {
        if (altCustomerId === customerId) continue;
        
        const altEndpoint = `accounting/v2/tenant/${tenantId}/invoices?customerId=${altCustomerId}&pageSize=100`;
        const altResponse = await serviceTitanAuth.makeRequest<any>(altEndpoint);
        const altInvoices = altResponse?.data || [];
        const foundInvoice = altInvoices.find((inv: any) => inv.id === invoiceId);
        
        if (foundInvoice) {
          assertCustomerOwnership(foundInvoice.customerId, availableCustomerIds);
          return transformAndReturnInvoice(foundInvoice);
        }
      }
      
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify invoice belongs to customer (should already be true from query)
    assertCustomerOwnership(invoice.customerId, availableCustomerIds);
    
    return transformAndReturnInvoice(invoice);
  } catch (error: any) {
    console.error('[Portal Invoice Detail] Error:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Forbidden - This invoice does not belong to you' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to load invoice details' },
      { status: 500 }
    );
  }
}

function transformAndReturnInvoice(invoice: any) {
  // Transform invoice to consistent format with line items
  const invoiceDetail = {
    id: invoice.id,
    number: invoice.invoiceNumber || invoice.number || invoice.referenceNumber || `INV-${invoice.id}`,
    date: invoice.createdOn || invoice.invoiceDate,
    dueDate: invoice.dueDate,
    status: invoice.status || 'Unknown',
    subtotal: invoice.subTotal || invoice.subtotal || 0,
    tax: invoice.salesTax || invoice.tax || 0,
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

  console.log(`[Portal Invoice Detail] Retrieved invoice ${invoice.id} with ${invoiceDetail.items.length} items`);

  return NextResponse.json(invoiceDetail);
}
