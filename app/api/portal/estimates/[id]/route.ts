import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanEstimates } from '@/server/lib/servicetitan/estimates';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

/**
 * GET /api/portal/estimates/[id]
 * Fetch detailed estimate with line items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    console.log(`[Portal Estimate Detail] Fetching estimate ${estimateId} for customer ${customerId}`);

    // Fetch estimate details from ServiceTitan
    const estimate = await serviceTitanEstimates.getEstimateById(estimateId);

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify estimate belongs to authorized customer
    assertCustomerOwnership(estimate.customerId, availableCustomerIds);

    // Calculate sold hours for scheduler integration
    const soldHours = serviceTitanEstimates.calculateSoldHours(estimate);

    console.log(`[Portal Estimate Detail] Retrieved estimate ${estimateId} with ${estimate.items.length} items (${soldHours} sold hours)`);

    return NextResponse.json({
      ...estimate,
      soldHours, // Add sold hours for scheduler handoff
    });
  } catch (error: any) {
    console.error('[Portal Estimate Detail] Error:', error);
    
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
      { error: error.message || 'Failed to load estimate details' },
      { status: 500 }
    );
  }
}
