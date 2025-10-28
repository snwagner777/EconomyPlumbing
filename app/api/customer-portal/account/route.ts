/**
 * Customer Portal API - Account Information
 * 
 * Get authenticated customer's account details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.customerPortalAuth) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    const customer = await storage.getCustomerByServiceTitanId(customerId);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Return safe subset of customer data
    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        mobilePhone: customer.mobilePhone,
        street: customer.street,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        type: customer.type,
        balance: customer.balance,
        jobCount: customer.jobCount,
        lastServiceDate: customer.lastServiceDate,
        lastServiceType: customer.lastServiceType,
        lifetimeValue: customer.lifetimeValue,
      },
    });
  } catch (error) {
    console.error('[Customer Portal Account API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account information' },
      { status: 500 }
    );
  }
}
