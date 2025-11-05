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

    // Try to find ALL contacts by phone first, then email as fallback
    let contacts: any[] = [];
    
    if (phone) {
      const normalizedPhone = normalizeContact(phone, 'phone');
      contacts = await db.query.serviceTitanContacts.findMany({
        where: eq(serviceTitanContacts.normalizedValue, normalizedPhone),
      });
    }
    
    // If not found by phone, try email
    if (contacts.length === 0 && email) {
      const normalizedEmail = normalizeContact(email, 'email');
      contacts = await db.query.serviceTitanContacts.findMany({
        where: eq(serviceTitanContacts.normalizedValue, normalizedEmail),
      });
    }

    if (contacts.length === 0) {
      console.log(`[Scheduler] No customer found`);
      return NextResponse.json({ 
        success: false,
        customers: [],
      });
    }

    // Get all unique customer IDs
    const uniqueCustomerIds = [...new Set(contacts.map(c => c.customerId))];
    
    // Get all matching customers
    const customers = await db.query.serviceTitanCustomers.findMany({
      where: (table, { inArray }) => inArray(table.id, uniqueCustomerIds),
    });

    if (customers.length === 0) {
      console.log(`[Scheduler] Contacts found but customers not found`);
      return NextResponse.json({ 
        success: false,
        customers: [],
      });
    }

    // Build response with all customers and their contact info
    const customersWithContacts = await Promise.all(
      customers.map(async (customer) => {
        const customerContacts = await db.query.serviceTitanContacts.findMany({
          where: eq(serviceTitanContacts.customerId, customer.id),
        });

        const customerPhone = customerContacts.find(c => c.contactType === 'Phone' || c.contactType === 'MobilePhone')?.value || phone;
        const customerEmail = customerContacts.find(c => c.contactType === 'Email')?.value || email;

        const locations = customer.street ? [{
          id: customer.id,
          name: 'Primary Location',
          street: customer.street,
          city: customer.city,
          state: customer.state,
          zip: customer.zip,
          isPrimary: true,
        }] : [];

        return {
          id: customer.id,
          serviceTitanId: customer.id,
          name: customer.name,
          email: customerEmail,
          phoneNumber: customerPhone,
          type: customer.type,
          customerTags: customer.customerTags || [],
          locations,
        };
      })
    );

    console.log(`[Scheduler] Found ${customersWithContacts.length} customer(s) matching ${phone || email}`);

    return NextResponse.json({
      success: true,
      customers: customersWithContacts,
    });
  } catch (error: any) {
    console.error('[Scheduler] Customer lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer', details: error.message },
      { status: 500 }
    );
  }
}
