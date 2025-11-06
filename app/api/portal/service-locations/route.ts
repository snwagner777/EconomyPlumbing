import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';

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

export async function POST(req: NextRequest) {
  try {
    const { customerId, name, street, unit, city, state, zip } = await req.json();

    if (!customerId || !street || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Customer ID, street, city, state, and zip are required' },
        { status: 400 }
      );
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Add service location 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Add service location denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: error.message || 'Failed to create service location' },
      { status: 500 }
    );
  }
}
