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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const { customerId, type, value, memo } = await req.json();

    if (!customerId || !contactId || !type || !value) {
      return NextResponse.json(
        { error: 'Customer ID, contact ID, type, and value are required' },
        { status: 400 }
      );
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Edit customer contact 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Edit customer contact denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log(`[Portal] Updating contact ${contactId} for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    
    // Update contact via ServiceTitan API
    await serviceTitan.updateCustomerContact(
      parseInt(customerId),
      parseInt(contactId),
      { type, value, memo }
    );

    return NextResponse.json({ success: true, message: 'Contact updated successfully' });
  } catch (error: any) {
    console.error('[Portal] Edit customer contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const { customerId } = await req.json();

    if (!customerId || !contactId) {
      return NextResponse.json(
        { error: 'Customer ID and Contact ID required' },
        { status: 400 }
      );
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Delete customer contact 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Delete customer contact denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log(`[Portal] Deleting contact ${contactId} for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    await serviceTitan.deleteCustomerContact(parseInt(customerId), parseInt(contactId));

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    console.error('[Portal] Delete customer contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
