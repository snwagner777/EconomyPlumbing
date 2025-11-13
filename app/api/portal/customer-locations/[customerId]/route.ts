import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface PortalSessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Customer locations 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Customer locations denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log(`[Portal] Fetching all locations for customer ${customerId}...`);

    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();

    // Fetch all locations for customer
    const rawLocations = await serviceTitan.getAllCustomerLocations(parseInt(customerId));

    // Enrich each location with full contact details (including method IDs)
    const locationsWithContacts = await Promise.all(
      rawLocations.map(async (location: any) => {
        try {
          // Fetch full contact details for this location
          const contacts = await serviceTitanCRM.getLocationContacts(location.id);
          
          // Transform contacts to include both person-level and method-level data
          const enrichedContacts = contacts.map((contact) => ({
            id: contact.id, // Contact person ID (GUID)
            name: contact.name,
            title: contact.title,
            methods: contact.methods.map((method) => ({
              id: method.id, // Contact method ID (GUID) - needed for updates
              type: method.type,
              value: method.value,
              memo: method.memo,
            })),
          }));

          return {
            ...location,
            contacts: enrichedContacts,
          };
        } catch (error) {
          console.error(`[Portal] Error fetching contacts for location ${location.id}:`, error);
          // Return location without enriched contacts if fetch fails
          return {
            ...location,
            contacts: [],
          };
        }
      })
    );

    return NextResponse.json({ locations: locationsWithContacts });
  } catch (error: any) {
    console.error('[Portal] Get all locations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer locations' },
      { status: 500 }
    );
  }
}
