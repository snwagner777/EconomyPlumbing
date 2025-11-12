/**
 * Public Customer Lookup API
 * 
 * Finds existing ServiceTitan customer by phone OR creates a placeholder
 * Returns customer ID for subsequent checkout/scheduler flows
 * 
 * Note: This creates minimal customer records. Full details collected during checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

const lookupSchema = z.object({
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = lookupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    const { phone } = result.data;

    console.log(`[Public Lookup] Searching for customer with phone: ${phone}`);

    // Try to find existing customer
    const existingCustomer = await serviceTitanCRM.findCustomerByPhone(phone);

    if (existingCustomer) {
      console.log(`[Public Lookup] Found existing customer: ${existingCustomer.id}`);
      return NextResponse.json({
        success: true,
        customerId: existingCustomer.id,
        customerName: existingCustomer.name,
        isNewCustomer: false,
      });
    }

    // Customer not found - create placeholder (details will be collected during checkout)
    console.log(`[Public Lookup] Customer not found, creating placeholder record`);
    
    const newCustomer = await serviceTitanCRM.ensureCustomer({
      name: 'Web Visitor', // Placeholder - will be updated during checkout
      phone,
      email: undefined,
      address: {
        street: 'To be provided',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      },
    });

    console.log(`[Public Lookup] Created new customer placeholder: ${newCustomer.id}`);

    return NextResponse.json({
      success: true,
      customerId: newCustomer.id,
      customerName: 'Web Visitor',
      isNewCustomer: true,
    });

  } catch (error: any) {
    console.error('[Public Lookup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to lookup customer',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
