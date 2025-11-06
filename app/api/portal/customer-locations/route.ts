import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface PortalSessionData {
  portalCustomerId?: number;
  portalAvailableCustomerIds?: number[];
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function GET(request: NextRequest) {
  try {
    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.portalCustomerId || !session.portalAvailableCustomerIds) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get customerId from query parameter or use session customerId
    const { searchParams } = new URL(request.url);
    const requestedCustomerId = searchParams.get('customerId');
    
    const customerId = requestedCustomerId 
      ? parseInt(requestedCustomerId, 10)
      : session.portalCustomerId;

    // Verify user has access to this customer ID
    if (!session.portalAvailableCustomerIds.includes(customerId)) {
      console.log(
        `[Portal] Customer locations denied - Customer ${customerId} not in available accounts:`,
        session.portalAvailableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log(`[Portal] Fetching all locations for customer ${customerId}...`);

    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();

    const locations = await serviceTitan.getAllCustomerLocations(customerId);

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error('[Portal] Get all locations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer locations' },
      { status: 500 }
    );
  }
}
