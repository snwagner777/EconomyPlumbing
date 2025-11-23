import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';
import { ServiceTitanPricebook } from '@/server/lib/servicetitan/pricebook';

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
    // Use the list endpoint with ids query parameter to fetch specific invoice
    const tenantId = serviceTitanAuth.getTenantId();
    
    // Fetch specific invoice by ID using ids query parameter
    const endpoint = `accounting/v2/tenant/${tenantId}/invoices?ids=${invoiceId}`;
    console.log(`[Portal Invoice Detail] Fetching invoice ${invoiceId} using ids filter`);
    
    const response = await serviceTitanAuth.makeRequest<any>(endpoint);
    const invoices = response?.data || [];
    
    // Should return exactly one invoice
    const invoice = invoices[0];

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // DEBUG: Log invoice structure to find customer ID field
    console.log(`[Portal Invoice Detail] Invoice keys:`, Object.keys(invoice));
    console.log(`[Portal Invoice Detail] Invoice customer info - customerId: ${invoice.customerId}, customer: ${JSON.stringify(invoice.customer)}`);

    // SECURITY: Verify invoice belongs to one of the customer's accounts
    const invoiceCustomerId = invoice.customerId || invoice.customer?.id;
    console.log(`[Portal Invoice Detail] Validating ownership - Invoice customerId: ${invoiceCustomerId}, Available IDs: ${JSON.stringify(availableCustomerIds)}`);
    assertCustomerOwnership(invoiceCustomerId, availableCustomerIds);
    
    // Fetch pricebook images for line items
    const pricebook = new ServiceTitanPricebook();
    const itemsWithImages = await enrichInvoiceItemsWithImages(invoice.items || [], pricebook);
    
    return transformAndReturnInvoice(invoice, itemsWithImages);
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

async function enrichInvoiceItemsWithImages(items: any[], pricebook: ServiceTitanPricebook) {
  const enrichedItems = [];
  
  for (const item of items) {
    let imageUrl = null;
    let displayName = item.skuName || item.description || 'Unknown';
    
    // Fetch pricebook data if we have a SKU ID and type
    if (item.skuId && item.type) {
      try {
        const pricebookItem = await pricebook.getPricebookItem(
          item.skuId,
          item.type as 'Material' | 'Equipment' | 'Service'
        );
        
        if (pricebookItem) {
          // Use pricebook display name and get first image
          displayName = pricebookItem.displayName || displayName;
          if (pricebookItem.images && pricebookItem.images.length > 0) {
            imageUrl = pricebookItem.images[0].url;
          }
        }
      } catch (error) {
        console.error(`[Portal Invoice Detail] Error fetching pricebook item ${item.skuId}:`, error);
      }
    }
    
    enrichedItems.push({
      ...item,
      displayName,
      imageUrl,
    });
  }
  
  return enrichedItems;
}

function transformAndReturnInvoice(invoice: any, itemsWithImages: any[]) {
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
    items: itemsWithImages.map((item: any) => ({
      id: item.id,
      type: item.type || 'Service',
      skuName: item.displayName || item.skuName || item.description || 'Unknown',
      description: item.description || '',
      quantity: item.quantity || 1,
      price: item.price || item.unitPrice || 0,
      total: item.total || (item.price * item.quantity) || 0,
      memberPrice: item.memberPrice,
      imageUrl: item.imageUrl || null,
    })),
  };

  console.log(`[Portal Invoice Detail] Retrieved invoice ${invoice.id} with ${invoiceDetail.items.length} items`);

  return NextResponse.json(invoiceDetail);
}
