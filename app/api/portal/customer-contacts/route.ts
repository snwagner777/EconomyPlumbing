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
    const { customerId, type, value, memo } = await req.json();

    if (!customerId || !type || !value) {
      return NextResponse.json(
        { error: 'Customer ID, type, and value are required' },
        { status: 400 }
      );
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Add customer contact 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Add customer contact denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

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
    return NextResponse.json(
      { error: error.message || 'Failed to add contact' },
      { status: 500 }
    );
  }
}
