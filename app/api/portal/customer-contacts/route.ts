import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function POST(req: NextRequest) {
  try {
    const { customerId, type, value, memo } = await req.json();

    if (!customerId || !type || !value) {
      return NextResponse.json(
        { error: 'Customer ID, type, and value are required' },
        { status: 400 }
      );
    }

    // Get session and validate authentication
    const { availableCustomerIds } = await getPortalSession();

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    assertCustomerOwnership(requestedCustomerId, availableCustomerIds);

    console.log(`[Portal] Adding ${type} contact for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    
    // Create new contact via ServiceTitan API
    await serviceTitan.addCustomerContact(parseInt(customerId), {
      type,
      value,
      memo
    });

    return NextResponse.json({ success: true, message: 'Contact added successfully' });
  } catch (error: any) {
    console.error('[Portal] Add customer contact error:', error);
    
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
    
    // Check for ServiceTitan "customer not active" error
    if (error.message && error.message.includes('is not active')) {
      return NextResponse.json(
        { error: 'Cannot add contacts to inactive customer accounts. Please contact support to reactivate this account.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to add contact' },
      { status: 500 }
    );
  }
}
