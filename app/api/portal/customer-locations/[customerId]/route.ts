import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // SECURITY: Validate session and customer ownership
    const { availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(parseInt(customerId), availableCustomerIds);

    console.log(`[Portal] Fetching all locations for customer ${customerId}...`);

    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();

    // Fetch all locations for customer
    const rawLocations = await serviceTitan.getAllCustomerLocations(parseInt(customerId));

    // Enrich each location with contact methods (flat array)
    const locationsWithContacts = await Promise.all(
      rawLocations.map(async (location: any) => {
        try {
          // Fetch contact methods for this location - already returns flat array
          const contactMethods = await serviceTitanCRM.getLocationContacts(location.id);
          
          return {
            ...location,
            contactMethods, // Flat array: [{id, type, value, memo}, ...]
          };
        } catch (error) {
          console.error(`[Portal] Error fetching contacts for location ${location.id}:`, error);
          // Return location without contacts if fetch fails
          return {
            ...location,
            contactMethods: [],
          };
        }
      })
    );

    return NextResponse.json({ locations: locationsWithContacts });
  } catch (error: any) {
    console.error('[Portal] Get all locations error:', error);
    
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
      { error: 'Failed to fetch customer locations' },
      { status: 500 }
    );
  }
}
