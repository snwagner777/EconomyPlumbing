import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, address, phone, email, specialInstructions, name } = body;

    if (!customerId || !address || !phone) {
      return NextResponse.json(
        { error: 'Customer ID, address, and phone required' },
        { status: 400 }
      );
    }

    if (!address.street || !address.city || !address.state || !address.zip) {
      return NextResponse.json(
        { error: 'Complete address required (street, city, state, zip)' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Creating location for customer ${customerId}`);

    const location = await serviceTitanCRM.createLocation({
      customerId: parseInt(customerId, 10),
      name: name || undefined,
      address: {
        street: address.street,
        unit: address.unit, // CRITICAL: Pass through unit field for apartments/suites
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
      phone,
      email,
    });

    if (specialInstructions && specialInstructions.trim()) {
      console.log(`[Scheduler] Adding special instructions as pinned note to location ${location.id}`);
      await serviceTitanCRM.createLocationNote(
        location.id,
        `Special Instructions: ${specialInstructions.trim()}`,
        true
      );
    }

    console.log(`[Scheduler] Location created: ${location.id}`);

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        address: location.address,
        hasSpecialInstructions: !!(specialInstructions && specialInstructions.trim()),
      },
    });
  } catch (error: any) {
    console.error('[Scheduler] Create location error:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
