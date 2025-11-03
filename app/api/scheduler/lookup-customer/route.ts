import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Phone or email required' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Looking up customer by ${phone ? 'phone' : 'email'}: ${phone || email}`);

    const customer = await serviceTitanCRM.findCustomer(phone, email);

    if (!customer) {
      return NextResponse.json({ 
        found: false,
        customer: null,
        locations: []
      });
    }

    const tenantId = serviceTitanAuth.getTenantId();
    const locationsResponse = await serviceTitanAuth.makeRequest<{ data: any[] }>(
      `crm/v2/tenant/${tenantId}/locations?customerId=${customer.id}&active=true`
    );

    const locations = locationsResponse.data || [];

    console.log(`[Scheduler] Found customer ${customer.id} with ${locations.length} location(s)`);

    return NextResponse.json({
      found: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.contacts?.find(c => c.type === 'Email')?.value || '',
        phone: customer.contacts?.find(c => c.type === 'Phone' || c.type === 'MobilePhone')?.value || phone,
        address: customer.address,
      },
      locations: locations.map(loc => ({
        id: loc.id,
        address: loc.address,
        isPrimary: loc.id === customer.id,
      })),
    });
  } catch (error: any) {
    console.error('[Scheduler] Customer lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}
