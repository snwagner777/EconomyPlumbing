/**
 * Customer Portal - Location Management API
 * 
 * AUTHENTICATED ENDPOINT - Requires customer login via phone-based SMS 2FA
 * Allows customers to rename their service locations ONLY
 * Service addresses are managed by office staff (cannot be edited)
 * 
 * Security: ServiceTitan v2 API as single source of truth, session-based authentication with ownership validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/customer-portal/locations/[id]
 * Retrieve single location details
 * 
 * Security: Validates session, ensures location belongs to authenticated customer
 */
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const locationId = parseInt(id, 10);

    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    console.log(`[Customer Portal] Fetching location ${locationId} for customer ${customerId}`);

    // Fetch location from ServiceTitan
    const location = await serviceTitanCRM.getLocation(locationId);

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Verify ownership: location must belong to authenticated customer
    if (location.customerId !== customerId) {
      console.warn(`[Customer Portal] Unauthorized access attempt: customer ${customerId} tried to access location ${locationId} (belongs to customer ${location.customerId})`);
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this location' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        name: location.name,
        address: location.address,
        customerId: location.customerId,
      },
    });

  } catch (error: any) {
    console.error('[Customer Portal] Get location error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve location' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customer-portal/locations/[id]
 * Rename a service location (name only, address is read-only)
 * 
 * Security: Validates session, ensures location belongs to authenticated customer
 */
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const locationId = parseInt(id, 10);

    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    const body = await req.json();
    const { name } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Location name must be 100 characters or less' },
        { status: 400 }
      );
    }

    console.log(`[Customer Portal] Renaming location ${locationId} for customer ${customerId}`);

    // Verify ownership BEFORE updating
    const existingLocation = await serviceTitanCRM.getLocation(locationId);

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (existingLocation.customerId !== customerId) {
      console.warn(`[Customer Portal] Unauthorized update attempt: customer ${customerId} tried to update location ${locationId} (belongs to customer ${existingLocation.customerId})`);
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this location' },
        { status: 403 }
      );
    }

    // Update location name in ServiceTitan
    const updatedLocation = await serviceTitanCRM.updateLocation(locationId, {
      name: name.trim(),
    });

    console.log(`[Customer Portal] ✅ Location ${locationId} renamed to "${name.trim()}" for customer ${customerId}`);

    return NextResponse.json({
      success: true,
      location: {
        id: updatedLocation.id,
        name: updatedLocation.name,
        address: updatedLocation.address,
        customerId: updatedLocation.customerId,
      },
      message: 'Location renamed successfully',
    });

  } catch (error: any) {
    console.error('[Customer Portal] Update location error:', error);
    
    // Parse ServiceTitan RFC7807 error if present
    if (error.response?.data?.traceId) {
      console.error(`[Customer Portal] ServiceTitan error traceId: ${error.response.data.traceId}`);
    }

    return NextResponse.json(
      { 
        error: 'Failed to rename location', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
