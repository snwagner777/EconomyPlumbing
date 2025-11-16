import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function DELETE(req: NextRequest) {
  try {
    const { customerId, contactId } = await req.json();

    if (!customerId || !contactId) {
      return NextResponse.json(
        { error: "Customer ID and Contact ID required" },
        { status: 400 }
      );
    }

    // Get session and validate authentication
    const { availableCustomerIds } = await getPortalSession();

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    assertCustomerOwnership(requestedCustomerId, availableCustomerIds);

    console.log(`[Portal] Deleting contact ${contactId} for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    await serviceTitan.deleteCustomerContact(parseInt(customerId), parseInt(contactId));

    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (error: any) {
    console.error("[Portal] Delete contact error:", error);
    
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
      { error: error.message || "Failed to delete contact" },
      { status: 500 }
    );
  }
}
