import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { serviceTitanEstimates } from '@/server/lib/servicetitan/estimates';

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
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log(`[Portal Estimate Detail] Fetching estimate ${estimateId} for customer ${session.customerId}`);

    // Fetch estimate details from ServiceTitan
    const estimate = await serviceTitanEstimates.getEstimateById(estimateId);

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify estimate belongs to customer
    if (estimate.customerId !== session.customerId) {
      console.error(`[Portal Estimate Detail] Security violation: Customer ${session.customerId} attempted to access estimate ${estimateId} for customer ${estimate.customerId}`);
      return NextResponse.json(
        { error: 'Unauthorized - This estimate does not belong to you' },
        { status: 403 }
      );
    }

    // Calculate sold hours for scheduler integration
    const soldHours = serviceTitanEstimates.calculateSoldHours(estimate);

    console.log(`[Portal Estimate Detail] Retrieved estimate ${estimateId} with ${estimate.items.length} items (${soldHours} sold hours)`);

    return NextResponse.json({
      ...estimate,
      soldHours, // Add sold hours for scheduler handoff
    });
  } catch (error: any) {
    console.error('[Portal Estimate Detail] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load estimate details' },
      { status: 500 }
    );
  }
}
