import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function PUT(req: NextRequest) {
  try {
    const { customerId, email, phone } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    // Get session and validate authentication
    const { availableCustomerIds } = await getPortalSession();

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    assertCustomerOwnership(requestedCustomerId, availableCustomerIds);

    console.log(`[Portal] Updating contacts for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    await serviceTitan.updateCustomerContacts(parseInt(customerId), {
      email,
      phone
    });

    return NextResponse.json({ success: true, message: "Contact information updated successfully" });
  } catch (error: any) {
    console.error("[Portal] Update contacts error:", error);
    
    // Handle session errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to update contact information" },
      { status: 500 }
    );
  }
}
