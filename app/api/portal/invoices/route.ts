import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { getPortalSession } from '@/server/lib/customer-portal/portal-session';

/**
 * GET /api/portal/invoices
 * Fetch invoices for authenticated customer with optional filtering
 * Query params:
 *   - locationId: Filter by specific location
 *   - status: Filter by status (Paid, Unpaid, etc.)
 *   - page: Page number (default: 1)
 *   - pageSize: Items per page (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Validate session
    const { customerId } = await getPortalSession();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 100);

    // Build ServiceTitan API query
    const tenantId = serviceTitanAuth.getTenantId();
    const queryParams = new URLSearchParams({
      customerId: customerId.toString(),
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (locationId) {
      queryParams.append('locationId', locationId);
    }

    if (status) {
      queryParams.append('status', status);
    }

    console.log(`[Portal Invoices] Fetching invoices for customer ${customerId}`);

    const response = await serviceTitanAuth.makeRequest<any>(
      `accounting/v2/tenant/${tenantId}/invoices?${queryParams.toString()}`
    );

    if (!response?.data) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        pageSize,
      });
    }

    // Transform invoices to consistent format
    const invoices = response.data.map((inv: any) => ({
      id: inv.id,
      number: inv.invoiceNumber || inv.number || `INV-${inv.id}`,
      date: inv.createdOn || inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.status || 'Unknown',
      subtotal: inv.subtotal || 0,
      tax: inv.tax || 0,
      total: inv.total || 0,
      balance: inv.balance || 0,
      jobId: inv.jobId,
      jobNumber: inv.job?.number || inv.jobNumber,
      locationId: inv.locationId,
      customerId: inv.customerId,
      summary: inv.summary || inv.job?.summary,
    }));

    console.log(`[Portal Invoices] Found ${invoices.length} invoices for customer ${customerId}`);

    return NextResponse.json({
      data: invoices,
      total: response.totalCount || invoices.length,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('[Portal Invoices] Error:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to load invoices' },
      { status: 500 }
    );
  }
}
