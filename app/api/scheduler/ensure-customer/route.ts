import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { customersXlsx } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { validateSchedulerSession, updateSessionCustomerId } from '@/server/lib/schedulerSession';

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    // SECURITY: Require valid session token for customer creation
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Session token required. Please complete 2FA verification first.' },
        { status: 401 }
      );
    }
    
    const sessionToken = authHeader.substring(7);
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session token' },
        { status: 401 }
      );
    }
    
    // CRITICAL: Validate session BEFORE any database mutations
    const session = validateSchedulerSession(sessionToken);
    
    if (!session) {
      console.warn(`[Scheduler] ⚠️ Invalid or expired session token for customer creation`);
      return NextResponse.json(
        { error: 'Session expired or invalid. Please complete 2FA verification again.' },
        { status: 401 }
      );
    }
    
    console.log(`[Scheduler] ✅ Session validated - verified via ${session.verificationMethod}`);
    
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

    // CRITICAL FIX: Update session with customerId so future requests (contact creation, booking) work
    const updated = updateSessionCustomerId(sessionToken, customer.id);
    if (updated) {
      console.log(`[Scheduler] ✅ Session updated with customerId ${customer.id}`);
    } else {
      // Session token validation failed - this shouldn't happen since we validated above
      console.error(`[Scheduler] ❌ Failed to update session with customerId ${customer.id} - invalid session`);
      return NextResponse.json(
        { error: 'Session validation failed. Please refresh and try again.' },
        { status: 401 }
      );
    }

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
