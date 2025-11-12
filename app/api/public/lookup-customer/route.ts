/**
 * Public Customer Lookup API
 * 
 * Finds existing ServiceTitan customer by phone OR email, or creates a placeholder
 * Returns customer ID for subsequent checkout/scheduler flows
 * Reuses same modules as scheduler and customer portal
 * 
 * Note: This creates minimal customer records. Full details collected during checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

const TENANT_ID = process.env.SERVICETITAN_TENANT_ID!;

const phoneSchema = z.object({
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits'),
  customerType: z.enum(['residential', 'commercial']).optional(),
});

const emailSchema = z.object({
  email: z.string().email('Valid email is required'),
  customerType: z.enum(['residential', 'commercial']).optional(),
});

const lookupSchema = z.union([phoneSchema, emailSchema]);

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

    const data = result.data;
    
    // Determine lookup type and extract values
    let phone: string;
    let email: string | undefined;
    
    if ('phone' in data) {
      phone = data.phone;
      email = undefined;
      console.log(`[Public Lookup] Searching for customer by phone: ${phone}`);
    } else {
      phone = ''; // Required parameter, will be filled if customer found
      email = data.email;
      console.log(`[Public Lookup] Searching for customer by email: ${email}`);
    }

    // Search ServiceTitan directly to check for multiple matches
    let allMatches: any[] = [];
    
    if (phone) {
      const phoneSearch = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `crm/v2/tenant/${TENANT_ID}/customers?phone=${encodeURIComponent(phone)}&active=true`
      );
      allMatches = phoneSearch.data || [];
    } else if (email) {
      const emailSearch = await serviceTitanAuth.makeRequest<{ data: any[] }>(
        `crm/v2/tenant/${TENANT_ID}/customers?email=${encodeURIComponent(email)}&active=true`
      );
      allMatches = emailSearch.data || [];
    }

    // If multiple customers found, return all matches for selection
    // Only return minimal metadata to avoid PII leak
    if (allMatches.length > 1) {
      console.log(`[Public Lookup] Found ${allMatches.length} matching customers`);
      return NextResponse.json({
        success: true,
        multipleMatches: true,
        matches: allMatches.map((customer: any) => ({
          customerId: customer.id,
          customerName: customer.name,
          customerType: customer.type,
          // Only return city/state for privacy - not full street address
          address: customer.address ? {
            city: customer.address.city,
            state: customer.address.state,
          } : null,
        })),
      });
    }

    // Single customer found
    if (allMatches.length === 1) {
      const existingCustomer = allMatches[0];
      console.log(`[Public Lookup] Found existing customer: ${existingCustomer.id}`);
      
      // Extract phone from customer contacts if found by email
      let resultPhone = phone;
      if (!phone && existingCustomer.contacts) {
        const phoneContact = existingCustomer.contacts.find((c: any) => 
          c.type === 'MobilePhone' || c.type === 'Phone'
        );
        resultPhone = phoneContact?.value.replace(/\D/g, '') || '';
      }
      
      return NextResponse.json({
        success: true,
        customerId: existingCustomer.id,
        customerName: existingCustomer.name,
        customerType: existingCustomer.type,
        phone: resultPhone,
        isNewCustomer: false,
      });
    }

    // Customer not found - create placeholder (details will be collected during checkout)
    console.log(`[Public Lookup] Customer not found, creating placeholder record`);
    
    // Convert customer type to ServiceTitan format
    const customerType = 'customerType' in data && data.customerType
      ? data.customerType.charAt(0).toUpperCase() + data.customerType.slice(1) as 'Residential' | 'Commercial'
      : 'Residential'; // Default to residential
    
    const newCustomer = await serviceTitanCRM.ensureCustomer({
      name: 'Web Visitor', // Placeholder - will be updated during checkout
      phone: phone || '0000000000', // Placeholder if email lookup
      email: email,
      customerType: customerType,
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
      phone: phone || '',
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
