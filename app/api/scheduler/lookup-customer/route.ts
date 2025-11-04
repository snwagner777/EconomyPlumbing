import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { serviceTitanCustomers, serviceTitanContacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Normalize phone/email for searching
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
    const { phone, email } = body;

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Phone or email required' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Looking up customer in local DB by ${phone ? 'phone' : 'email'}: ${phone || email}`);

    // Try to find contact by phone first, then email as fallback
    let contact = null;
    
    if (phone) {
      const normalizedPhone = normalizeContact(phone, 'phone');
      contact = await db.query.serviceTitanContacts.findFirst({
        where: eq(serviceTitanContacts.normalizedValue, normalizedPhone),
      });
    }
    
    // If not found by phone, try email
    if (!contact && email) {
      const normalizedEmail = normalizeContact(email, 'email');
      contact = await db.query.serviceTitanContacts.findFirst({
        where: eq(serviceTitanContacts.normalizedValue, normalizedEmail),
      });
    }

    if (!contact) {
      console.log(`[Scheduler] No customer found`);
      return NextResponse.json({ 
        success: false,
        customer: null,
        locations: []
      });
    }

    // Get customer data
    const customer = await db.query.serviceTitanCustomers.findFirst({
      where: eq(serviceTitanCustomers.id, contact.customerId),
    });

    if (!customer) {
      console.log(`[Scheduler] Contact found but customer not found`);
      return NextResponse.json({ 
        success: false,
        customer: null,
        locations: []
      });
    }

    // Get all contacts for this customer (for phone/email display)
    const allContacts = await db.query.serviceTitanContacts.findMany({
      where: eq(serviceTitanContacts.customerId, customer.id),
    });

    const customerPhone = allContacts.find(c => c.contactType === 'Phone' || c.contactType === 'MobilePhone')?.value || phone;
    const customerEmail = allContacts.find(c => c.contactType === 'Email')?.value || email;

    console.log(`[Scheduler] Found customer ${customer.id}: ${customer.name}`);

    // For now, return single location (primary address from customer record)
    const locations = customer.street ? [{
      id: customer.id,
      name: 'Primary Location',
      street: customer.street,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      isPrimary: true,
    }] : [];

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id, // Local DB ID
        serviceTitanId: customer.id, // ServiceTitan customer ID (same as id in this table)
        name: customer.name,
        email: customerEmail,
        phoneNumber: customerPhone,
        type: customer.type,
      },
      locations,
    });
  } catch (error: any) {
    console.error('[Scheduler] Customer lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer', details: error.message },
      { status: 500 }
    );
  }
}
