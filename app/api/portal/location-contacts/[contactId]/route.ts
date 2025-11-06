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
    const { customerId, locationId, type, value, memo, name } = await req.json();

    if (!customerId || !locationId || !contactId || !type || !value) {
      return NextResponse.json(
        { error: 'Customer ID, location ID, contact ID, type, and value are required' },
        { status: 400 }
      );
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Edit location contact 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Edit location contact denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log(`[Portal] Updating location contact ${contactId} for location ${locationId}...`);

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
    
    // Update location contact via ServiceTitan API
    await serviceTitan.updateLocationContact(
      parseInt(locationId),
      parseInt(contactId),
      { type, value, memo, name }
    );

    return NextResponse.json({ success: true, message: 'Location contact updated successfully' });
  } catch (error: any) {
    console.error('[Portal] Edit location contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update location contact' },
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
    const { customerId, locationId } = await req.json();

    if (!customerId || !locationId || !contactId) {
      return NextResponse.json(
        { error: 'Customer ID, location ID, and contact ID required' },
        { status: 400 }
      );
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    if (!session.customerId || !session.availableCustomerIds) {
      console.log('[Portal] Delete location contact 401 - No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.availableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Delete location contact denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log(`[Portal] Deleting location contact ${contactId} for location ${locationId}...`);

    const serviceTitan = getServiceTitanAPI();
    
    // Verify the location belongs to an authorized customer
    const locations = await serviceTitan.getAllCustomerLocations(requestedCustomerId);
    const location = locations.find((loc: any) => loc.id === parseInt(locationId));
    
    if (!location) {
      console.log(`[Portal] Location ${contactId} not found for customer ${requestedCustomerId}`);
      return NextResponse.json(
        { error: 'Location not found for this customer account' },
        { status: 404 }
      );
    }
    
    await serviceTitan.deleteLocationContact(parseInt(locationId), parseInt(contactId));

    return NextResponse.json({ success: true, message: 'Location contact deleted successfully' });
  } catch (error: any) {
    console.error('[Portal] Delete location contact error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete location contact' },
      { status: 500 }
    );
  }
}
