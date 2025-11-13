import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/lib/session';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

/**
 * DEBUG ENDPOINT: Compare raw ServiceTitan data vs normalized estimate
 * 
 * USAGE: GET /api/portal/estimates/debug/[estimateId]
 * 
 * Returns:
 * {
 *   raw: { ... ServiceTitan raw response },
 *   normalized: { ... our normalized estimate },
 *   validation: {
 *     subtotalIsNumber: true,
 *     totalIsNumber: true,
 *     items: [{ priceIsNumber: true, totalIsNumber: true, ... }]
 *   }
 * }
 * 
 * NOTE: Remove or gate behind admin auth in production!
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    const estimateId = parseInt(params.id, 10);
    if (isNaN(estimateId)) {
      return NextResponse.json(
        { error: 'Invalid estimate ID' },
        { status: 400 }
      );
    }

    // Get tenant ID from environment
    const tenantId = process.env.SERVICETITAN_TENANT_ID;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'ServiceTitan tenant ID not configured' },
        { status: 500 }
      );
    }

    // Import the estimates service to get normalized version
    const { serviceTitanEstimates } = await import('@/server/lib/servicetitan/estimates');
    const normalized = await serviceTitanEstimates.getEstimateById(estimateId);

    if (!normalized) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // CRITICAL: Verify the estimate belongs to the logged-in customer
    if (normalized.customerId !== session.customerId) {
      console.warn(
        `[Estimates Debug] Customer ${session.customerId} attempted to access estimate ${estimateId} belonging to customer ${normalized.customerId}`
      );
      return NextResponse.json(
        { error: 'Unauthorized - estimate belongs to another customer' },
        { status: 403 }
      );
    }

    // Fetch raw ServiceTitan data ONLY AFTER ownership verification
    const rawResponse = await serviceTitanAuth.makeRequest<any>(
      `sales/v2/tenant/${tenantId}/estimates/${estimateId}`
    );

    if (!rawResponse) {
      return NextResponse.json(
        { error: 'Raw data not found' },
        { status: 404 }
      );
    }

    // Perform validation
    const validation = {
      subtotalIsNumber: typeof normalized.subtotal === 'number' && Number.isFinite(normalized.subtotal),
      totalIsNumber: typeof normalized.total === 'number' && Number.isFinite(normalized.total),
      items: normalized.items.map((item, index) => ({
        index,
        id: item.id,
        priceIsNumber: typeof item.price === 'number' && Number.isFinite(item.price),
        totalIsNumber: typeof item.total === 'number' && Number.isFinite(item.total),
        costIsNumber: typeof item.cost === 'number' && Number.isFinite(item.cost),
        memberPriceIsNumber: item.memberPrice === undefined || 
          (typeof item.memberPrice === 'number' && Number.isFinite(item.memberPrice)),
      })),
      allValid: true,
    };

    // Check if all validations passed
    validation.allValid = 
      validation.subtotalIsNumber &&
      validation.totalIsNumber &&
      validation.items.every(item => 
        item.priceIsNumber && item.totalIsNumber && item.costIsNumber && item.memberPriceIsNumber
      );

    console.log(`[Estimates Debug] Estimate ${estimateId} validation:`, 
      validation.allValid ? 'PASS ✓' : 'FAIL ✗'
    );

    return NextResponse.json({
      raw: rawResponse,
      normalized,
      validation,
    });

  } catch (error: any) {
    console.error('[Estimates Debug] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to debug estimate' },
      { status: 500 }
    );
  }
}
