import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, address } = body;

    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'Name, phone, and address required' },
        { status: 400 }
      );
    }

    if (!address.street || !address.city || !address.state || !address.zip) {
      return NextResponse.json(
        { error: 'Complete address required (street, city, state, zip)' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Ensuring customer exists: ${name} (${phone})`);

    const customer = await serviceTitanCRM.ensureCustomer({
      name,
      phone,
      email,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
    });

    console.log(`[Scheduler] Customer ready: ${customer.id}`);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.contacts?.find(c => c.type === 'Email')?.value || email,
        phone: customer.contacts?.find(c => c.type === 'Phone' || c.type === 'MobilePhone')?.value || phone,
        address: customer.address,
      },
    });
  } catch (error: any) {
    console.error('[Scheduler] Ensure customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create/retrieve customer' },
      { status: 500 }
    );
  }
}
