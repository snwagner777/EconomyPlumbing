import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { db } from '@/server/db';
import { serviceTitanCustomers, serviceTitanContacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Normalize contact value for database storage
 */
function normalizeContact(value: string, type: 'phone' | 'email'): string {
  if (type === 'phone') {
    return value.replace(/\D/g, ''); // Digits only
  }
  return value.toLowerCase().trim(); // Lowercase for email
}

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

    // Step 1: Create/get customer in ServiceTitan
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

    console.log(`[Scheduler] Customer ready in ServiceTitan: ${customer.id}`);

    // Step 2: Sync to local database using upsert (don't wait for hourly sync)
    console.log(`[Scheduler] Syncing customer ${customer.id} to local database`);
    
    // Upsert customer record (insert or update)
    await db.insert(serviceTitanCustomers).values({
      id: customer.id.toString(),
      name: customer.name,
      type: customer.type || 'Residential',
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      active: true,
    }).onConflictDoUpdate({
      target: serviceTitanCustomers.id,
      set: {
        name: customer.name,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
    });

    // Upsert phone contact (insert or update by normalized value)
    if (phone) {
      const normalizedPhone = normalizeContact(phone, 'phone');
      await db.insert(serviceTitanContacts).values({
        customerId: customer.id.toString(),
        contactType: 'Phone',
        value: phone,
        normalizedValue: normalizedPhone,
      }).onConflictDoUpdate({
        target: serviceTitanContacts.normalizedValue,
        set: {
          value: phone,
          contactType: 'Phone',
        },
      });
    }

    // Upsert email contact (insert or update by normalized value)
    if (email) {
      const normalizedEmail = normalizeContact(email, 'email');
      await db.insert(serviceTitanContacts).values({
        customerId: customer.id.toString(),
        contactType: 'Email',
        value: email,
        normalizedValue: normalizedEmail,
      }).onConflictDoUpdate({
        target: serviceTitanContacts.normalizedValue,
        set: {
          value: email,
          contactType: 'Email',
        },
      });
    }

    console.log(`[Scheduler] Customer synced to local database`);

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
