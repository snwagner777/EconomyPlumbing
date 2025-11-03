import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, address, phone, email, gateCode } = body;

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
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
      phone,
      email,
    });

    if (gateCode && gateCode.trim()) {
      console.log(`[Scheduler] Adding gate code as pinned note to location ${location.id}`);
      await serviceTitanCRM.createLocationNote(
        location.id,
        `Gate Code: ${gateCode.trim()}`,
        true
      );
    }

    console.log(`[Scheduler] Location created: ${location.id}`);

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        address: location.address,
        hasGateCode: !!(gateCode && gateCode.trim()),
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
