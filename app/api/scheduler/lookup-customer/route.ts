import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { or, sql, eq, and } from 'drizzle-orm';

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

    console.log(`[Scheduler] Looking up customer in XLSX DB by ${phone ? 'phone' : 'email'}: ${phone || email}`);

    // Search in customers_xlsx table (XLSX import data)
    const searchValue = (phone || email).trim();
    const normalizedPhone = phone ? normalizeContact(phone, 'phone') : '';
    
    // Search by email OR phone in customers_xlsx (active customers only)
    const customers = await db
      .select()
      .from(customersXlsx)
      .where(
        and(
          eq(customersXlsx.active, true), // Only active customers
          or(
            email ? sql`${customersXlsx.email} ILIKE '%' || ${searchValue} || '%'` : sql`1=0`,
            phone ? sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') LIKE '%' || ${normalizedPhone} || '%'` : sql`1=0`
          )
        )
      );

    if (customers.length === 0) {
      console.log(`[Scheduler] No customer found in XLSX database`);
      return NextResponse.json({ 
        success: false,
        customers: [],
      });
    }

    // Build response with customer data from customers_xlsx
    const customersWithContacts = customers.map((customer) => {
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
        email: customer.email || email || '',
        phoneNumber: customer.phone || phone || '',
        type: customer.type,
        customerTags: [],
        locations,
      };
    });

    console.log(`[Scheduler] Found ${customersWithContacts.length} active customer(s) from XLSX matching ${phone || email}`);

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
