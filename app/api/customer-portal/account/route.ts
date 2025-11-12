/**
 * Customer Portal - Account Management API
 * 
 * AUTHENTICATED ENDPOINT - Requires customer login via phone-based SMS 2FA
 * Allows customers to update their billing address only
 * Other customer fields (name, type) are managed by office staff
 * 
 * Security: ServiceTitan v2 API as single source of truth, session-based authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/customer-portal/account
 * Retrieve customer account information
 * 
 * Security: Validates session, returns only the authenticated user's data
 */
export async function GET(req: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    console.log(`[Customer Portal] Fetching account for customer ${customerId}`);

    // Fetch from ServiceTitan (single source of truth)
    const customer = await serviceTitanCRM.getCustomer(customerId);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        address: customer.address,
        // Don't expose internal ServiceTitan metadata
      },
    });

  } catch (error: any) {
    console.error('[Customer Portal] Get account error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account information' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customer-portal/account
 * Update customer billing address
 * 
 * Security: Validates session, ensures user owns the customer account
 */
export async function PATCH(req: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    const body = await req.json();
    const { street, unit, city, state, zip } = body;

    // Validation
    if (!street || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Complete billing address required (street, city, state, zip)' },
        { status: 400 }
      );
    }

    // Validate ZIP format (5 digits)
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json(
        { error: 'ZIP code must be 5 digits' },
        { status: 400 }
      );
    }

    // Validate state (2-letter code)
    if (!/^[A-Z]{2}$/i.test(state)) {
      return NextResponse.json(
        { error: 'State must be 2-letter code (e.g., TX)' },
        { status: 400 }
      );
    }

    console.log(`[Customer Portal] Updating billing address for customer ${customerId}`);

    // Update in ServiceTitan
    const updatedCustomer = await serviceTitanCRM.updateCustomer(customerId, {
      address: {
        street,
        unit: unit || undefined,
        city,
        state: state.toUpperCase(),
        zip,
      },
    });

    // Sync to local database
    await db.update(customersXlsx)
      .set({
        street,
        city,
        state: state.toUpperCase(),
        zip,
      })
      .where(eq(customersXlsx.id, customerId));

    console.log(`[Customer Portal] ✅ Billing address updated for customer ${customerId}`);

    return NextResponse.json({
      success: true,
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        address: updatedCustomer.address,
      },
      message: 'Billing address updated successfully',
    });

  } catch (error: any) {
    console.error('[Customer Portal] Update account error:', error);
    
    // Parse ServiceTitan RFC7807 error if present
    if (error.response?.data?.traceId) {
      console.error(`[Customer Portal] ServiceTitan error traceId: ${error.response.data.traceId}`);
    }

    return NextResponse.json(
      { 
        error: 'Failed to update billing address', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
