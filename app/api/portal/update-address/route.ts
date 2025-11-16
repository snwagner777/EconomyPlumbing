import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function PUT(req: NextRequest) {
  try {
    const { customerId, locationId, street, city, state, zip } = await req.json();

    if (!customerId || !locationId) {
      return NextResponse.json(
        { error: "Customer ID and Location ID required" },
        { status: 400 }
      );
    }

    if (!street || !city || !state || !zip) {
      return NextResponse.json(
        { error: "All address fields are required" },
        { status: 400 }
      );
    }

    // SECURITY: Validate session and customer ownership
    const { availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(parseInt(customerId), availableCustomerIds);

    console.log(`[Portal] Updating address for location ${locationId}...`);

    const serviceTitan = getServiceTitanAPI();
    await serviceTitan.updateLocation(parseInt(locationId), {
      street,
      city,
      state,
      zip
    });

    return NextResponse.json({ success: true, message: "Service address updated successfully" });
  } catch (error: any) {
    console.error("[Portal] Update address error:", error);
    
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
      { error: error.message || "Failed to update service address" },
      { status: 500 }
    );
  }
}
