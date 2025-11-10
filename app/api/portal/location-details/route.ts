import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { serviceTitanPortalService } from '@/server/lib/servicetitan/portal-service';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = parseInt(searchParams.get('customerId') || '0');
    const locationId = parseInt(searchParams.get('locationId') || '0');
    
    if (!customerId || isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Valid customer ID required' },
        { status: 400 }
      );
    }

    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Valid location ID required' },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // SECURITY: Verify this customer is in the authorized list
    const availableCustomerIds = session.availableCustomerIds || [session.customerId];
    if (!availableCustomerIds.includes(customerId)) {
      console.error(`[Portal] Security violation: Customer ${session.customerId} attempted to access location data for customer ${customerId}`);
      return NextResponse.json(
        { error: 'Unauthorized - This account does not belong to you' },
        { status: 403 }
      );
    }
    
    // Fetch location details from ServiceTitan
    const locationDetails = await serviceTitanPortalService.getLocationDetails(customerId, locationId);
    
    return NextResponse.json(locationDetails);
  } catch (error: any) {
    console.error('[Portal Location Details] Error:', error);
    
    // Return 403 for authorization errors (location doesn't belong to customer)
    if (error.message && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    // Return 404 for not found errors
    if (error.message && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    // Return 500 for other errors
    return NextResponse.json(
      { error: error.message || 'Failed to load location details' },
      { status: 500 }
    );
  }
}
