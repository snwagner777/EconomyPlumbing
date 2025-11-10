/**
 * Customer Portal: Add New Location
 * 
 * Allows customers to add new service addresses to their account
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, address, city, state, zipCode, phone, email, specialInstructions } = body;

    if (!customerId || !address || !city || !state || !zipCode || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields (address, city, state, zipCode, phone)',
        },
        { status: 400 }
      );
    }

    console.log(`[Portal] Adding location for customer ${customerId}`);

    // Create location in ServiceTitan
    const location = await serviceTitanCRM.createLocation({
      customerId: parseInt(customerId),
      address: {
        street: address,
        city,
        state,
        zip: zipCode,
      },
      phone,
      email,
    });

    // Add special instructions as pinned note if provided
    if (specialInstructions && specialInstructions.trim()) {
      console.log(`[Portal] Adding special instructions as pinned note to location ${location.id}`);
      await serviceTitanCRM.createLocationNote(
        location.id,
        `Special Instructions: ${specialInstructions.trim()}`,
        true
      );
    }

    console.log(`[Portal] Location created successfully: ${location.id}`);

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        address: {
          street: location.address.street,
          city: location.address.city,
          state: location.address.state,
          zip: location.address.zip,
        },
      },
    });
  } catch (error: any) {
    console.error('[Portal] Add location error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add location',
      },
      { status: 500 }
    );
  }
}
