import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all customer accounts for logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession();
    const availableCustomerIds = session.customerPortalAuth?.availableCustomerIds;

    if (!availableCustomerIds || availableCustomerIds.length === 0) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use session customer IDs instead of trusting request body
    const customerIds = availableCustomerIds;

    console.log(`[Portal] Fetching account summaries for ${customerIds.length} customers`);

    // Fetch basic customer data for all IDs in parallel
    const accountPromises = customerIds.map(async (id) => {
      try {
        const customer = await serviceTitanCRM.getCustomer(id);
        
        if (!customer) {
          return {
            id,
            name: `Account #${id}`,
            type: 'Unknown',
            email: null,
            phoneNumber: null,
            locationCount: 0,
            primaryLocationId: null,
          };
        }
        
        const locations = await serviceTitanCRM.getCustomerLocations(id);
        const contacts = await serviceTitanCRM.getCustomerContacts(id);
        
        // Extract email and phone from contacts
        const emailContact = contacts.find(c => c.type === 'Email');
        const phoneContact = contacts.find(c => c.type === 'Phone' || c.type === 'MobilePhone');
        
        return {
          id: customer.id,
          name: customer.name,
          type: customer.type || 'Residential',
          email: emailContact?.value || null,
          phoneNumber: phoneContact?.value || null,
          locationCount: locations.length,
          primaryLocationId: locations[0]?.id || null,
        };
      } catch (error) {
        console.error(`[Portal] Error fetching account ${id}:`, error);
        return {
          id,
          name: `Account #${id}`,
          type: 'Unknown',
          email: null,
          phoneNumber: null,
          locationCount: 0,
          primaryLocationId: null,
        };
      }
    });

    const accounts = await Promise.all(accountPromises);

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('[Portal] Error fetching customer accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer accounts' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new customer account and add to session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, customerType, phone, email, address } = body;

    // Validate required fields
    if (!name || !customerType || !phone || !address?.street || !address?.city || !address?.state || !address?.zip) {
      return NextResponse.json(
        { error: 'Missing required fields: name, customerType, phone, address (street, city, state, zip)' },
        { status: 400 }
      );
    }

    // Validate customer type
    if (customerType !== 'Residential' && customerType !== 'Commercial') {
      return NextResponse.json(
        { error: 'Invalid customerType. Must be "Residential" or "Commercial"' },
        { status: 400 }
      );
    }

    console.log(`[Portal] Creating new ${customerType} account for ${name}`);

    // Create customer in ServiceTitan
    const customer = await serviceTitanCRM.createCustomer({
      name,
      customerType,
      phone,
      email,
      address: {
        street: address.street,
        unit: address.unit,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
    });

    console.log(`[Portal] Created customer ${customer.id}, adding to session`);

    // Add new customer ID to session's availableCustomerIds
    const currentCustomerIds = session.customerPortalAuth.availableCustomerIds || [session.customerPortalAuth.customerId];
    
    if (!currentCustomerIds.includes(customer.id)) {
      session.customerPortalAuth.availableCustomerIds = [...currentCustomerIds, customer.id];
      await session.save();
      console.log(`[Portal] Added customer ${customer.id} to session. Total accounts: ${session.customerPortalAuth.availableCustomerIds.length}`);
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        type: customer.type,
      },
    });
  } catch (error: any) {
    console.error('[Portal] Create account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
