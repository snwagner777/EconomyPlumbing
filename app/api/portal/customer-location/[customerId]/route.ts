import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    // SECURITY: Validate session and customer ownership
    const { availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(parseInt(customerId), availableCustomerIds);

    console.log(`[Portal] Fetching location for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    const location = await serviceTitan.getCustomerPrimaryLocation(parseInt(customerId));

    if (!location) {
      return NextResponse.json(
        { error: "No location found for customer" },
        { status: 404 }
      );
    }

    return NextResponse.json({ location });
  } catch (error: any) {
    console.error("[Portal] Get location error:", error);
    
    // Handle authentication/authorization errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch customer location" },
      { status: 500 }
    );
  }
}
