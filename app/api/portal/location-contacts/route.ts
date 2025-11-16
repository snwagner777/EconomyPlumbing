import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function POST(req: NextRequest) {
  try {
    const { customerId, locationId, type, value, memo, name } = await req.json();

    if (!customerId || !locationId || !type || !value) {
      return NextResponse.json(
        { error: 'Customer ID, location ID, type, and value are required' },
        { status: 400 }
      );
    }

    // Get session and validate authentication
    const { availableCustomerIds } = await getPortalSession();

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    assertCustomerOwnership(requestedCustomerId, availableCustomerIds);

    console.log(`[Portal] Adding ${type} contact for location ${locationId}...`);

    const serviceTitan = getServiceTitanAPI();
    
    // Verify the location belongs to an authorized customer
    const locations = await serviceTitan.getAllCustomerLocations(requestedCustomerId);
    const location = locations.find((loc: any) => loc.id === parseInt(locationId));
    
    if (!location) {
      console.log(`[Portal] Location ${locationId} not found for customer ${requestedCustomerId}`);
      return NextResponse.json(
        { error: 'Location not found for this customer account' },
        { status: 404 }
      );
    }
    
    // Create new location contact via ServiceTitan API
    await serviceTitan.addLocationContact(parseInt(locationId), {
      type,
      value,
      memo,
      name
    });

    return NextResponse.json({ success: true, message: 'Location contact added successfully' });
  } catch (error: any) {
    console.error('[Portal] Add location contact error:', error);
    
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
      { error: error.message || 'Failed to add location contact' },
      { status: 500 }
    );
  }
}
