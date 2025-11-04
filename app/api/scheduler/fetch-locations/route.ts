import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

/**
 * Fetch all locations for a customer from ServiceTitan
 * 
 * POST /api/scheduler/fetch-locations
 * Body: { serviceTitanCustomerId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceTitanCustomerId } = body;

    if (!serviceTitanCustomerId) {
      return NextResponse.json(
        { error: 'serviceTitanCustomerId is required' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Fetching locations from ServiceTitan for customer ${serviceTitanCustomerId}`);

    const locations = await serviceTitanCRM.getCustomerLocations(serviceTitanCustomerId);

    // Transform to simpler format for frontend
    const transformedLocations = locations.map(loc => ({
      id: loc.id,
      customerId: loc.customerId,
      name: loc.address.street, // Use address as name if no name provided
      address: {
        street: loc.address.street,
        city: loc.address.city,
        state: loc.address.state,
        zip: loc.address.zip,
      },
      contacts: loc.contacts || [],
    }));

    console.log(`[Scheduler] Returning ${transformedLocations.length} locations`);

    return NextResponse.json({
      success: true,
      locations: transformedLocations,
    });
  } catch (error: any) {
    console.error('[Scheduler] Fetch locations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: error.message },
      { status: 500 }
    );
  }
}
