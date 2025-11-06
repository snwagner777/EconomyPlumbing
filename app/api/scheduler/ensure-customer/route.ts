import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      firstName, lastName, 
      phone, email, 
      customerType, 
      address, unit, city, state, zip,
      sameAsBilling, locationName, 
      locationAddress, locationUnit, locationCity, locationState, locationZip,
      forceCreate
    } = body;

    const name = firstName && lastName ? `${firstName} ${lastName}` : body.name;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone required' },
        { status: 400 }
      );
    }

    if (!address || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Complete billing address required' },
        { status: 400 }
      );
    }

    // Determine service location address
    const serviceAddress = sameAsBilling !== false ? {
      street: address,
      unit: unit || undefined,
      city,
      state,
      zip,
    } : {
      street: locationAddress,
      unit: locationUnit || undefined,
      city: locationCity,
      state: locationState,
      zip: locationZip,
    };

    const customerData = {
      name,
      phone,
      email,
      customerType: customerType || 'Residential',
      address: {
        street: address,
        unit: unit || undefined,
        city,
        state,
        zip,
      },
      serviceLocation: {
        name: locationName || `${name} - Primary`,
        ...serviceAddress,
      },
    };

    let customer;

    if (forceCreate) {
      // User explicitly chose to create new customer - always create even if phone/email match
      console.log(`[Scheduler] Force creating new customer: ${name} (${phone}) - Type: ${customerType || 'Residential'}`);
      customer = await serviceTitanCRM.createCustomer(customerData);
    } else {
      // Default behavior: find existing or create new
      console.log(`[Scheduler] Ensuring customer exists: ${name} (${phone}) - Type: ${customerType || 'Residential'}`);
      customer = await serviceTitanCRM.ensureCustomer(customerData);
    }

    console.log(`[Scheduler] Customer ready in ServiceTitan: ${customer.id}`);

    // Step 2: Sync to local database (customers_xlsx) for immediate portal/scheduler access
    console.log(`[Scheduler] Syncing customer ${customer.id} to customers_xlsx immediately`);
    
    // Upsert customer record (insert or update)
    await db.insert(customersXlsx).values({
      id: customer.id,
      name: customer.name,
      type: customer.type || 'Residential',
      street: address,
      city,
      state,
      zip,
      phone,
      email: email || null,
      active: true,
    }).onConflictDoUpdate({
      target: customersXlsx.id,
      set: {
        name: customer.name,
        street: address,
        city,
        state,
        zip,
        phone,
        email: email || null,
      },
    });

    console.log(`[Scheduler] ✅ Customer ${customer.id} synced to customers_xlsx (immediate access)`);

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
      { error: 'Failed to create/retrieve customer', details: error.message },
      { status: 500 }
    );
  }
}
