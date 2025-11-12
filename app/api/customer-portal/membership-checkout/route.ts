/**
 * Customer Portal Membership Checkout
 * 
 * Creates Stripe checkout session for authenticated customer to purchase membership
 * Uses session token to get customer info from ServiceTitan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const checkoutSchema = z.object({
  membershipTypeId: z.number(),
  membershipTypeName: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { membershipTypeId, membershipTypeName } = result.data;

    // Fetch customer and location details from ServiceTitan
    const customer = await serviceTitanCRM.getCustomer(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found in ServiceTitan' },
        { status: 404 }
      );
    }

    // Get primary location
    const locations = await serviceTitanCRM.getCustomerLocations(customerId);
    const primaryLocation = locations[0];
    
    if (!primaryLocation) {
      return NextResponse.json(
        { error: 'No location found for customer' },
        { status: 404 }
      );
    }

    // Get contacts for the location
    const contacts = await serviceTitanCRM.getLocationContacts(primaryLocation.id);
    const phoneContact = contacts.find(c => c.methods.some(m => m.type === 'Phone'));
    const phoneNumber = phoneContact?.methods.find(m => m.type === 'Phone')?.value || '';

    const hostname = req.headers.get('host') || 'www.plumbersthatcare.com';
    const protocol = hostname.includes('localhost') ? 'http' : 'https';

    // Create Stripe checkout session
    // Note: Pricing comes from ServiceTitan billing options, but we'll use a placeholder for now
    // In production, you'd fetch the billing option price from ServiceTitan
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: membershipTypeName,
              description: 'VIP Membership for your property',
            },
            unit_amount: 29900, // $299 placeholder - fetch from ServiceTitan in production
          },
          quantity: 1,
        },
      ],
      success_url: `${protocol}://${hostname}/customer-portal/membership-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${protocol}://${hostname}/customer-portal?purchase_canceled=true`,
      metadata: {
        type: 'portal_membership_purchase',
        customerId: customerId.toString(),
        locationId: primaryLocation.id.toString(),
        membershipTypeId: membershipTypeId.toString(),
        membershipTypeName,
        customerName: customer.name,
        customerPhone: phoneNumber,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
    });

  } catch (error: any) {
    console.error('[Portal Membership Checkout] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
