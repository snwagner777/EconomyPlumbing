import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function POST(req: NextRequest) {
  try {
    const { customerId, name, street, unit, city, state, zip } = await req.json();

    if (!customerId || !street || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Customer ID, street, city, state, and zip are required' },
        { status: 400 }
      );
    }

    // SECURITY: Validate session and customer ownership
    const { availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(parseInt(customerId), availableCustomerIds);

    console.log(`[Portal] Adding new service location for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    
    // Build full street address with unit if provided
    const fullStreet = unit ? `${street} ${unit}` : street;
    
    // Create new service location via ServiceTitan API
    const location = await serviceTitan.createServiceLocation(parseInt(customerId), {
      name: name || 'Service Location',
      street: fullStreet,
      city,
      state,
      zip
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Service location created successfully',
      location 
    });
  } catch (error: any) {
    console.error('[Portal] Add service location error:', error);
    
    // Handle authentication/authorization errors
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
      { error: error.message || 'Failed to create service location' },
      { status: 500 }
    );
  }
}
