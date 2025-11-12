/**
 * Customer Portal - Complete Membership Purchase
 * 
 * Handles Stripe payment success, creates membership in ServiceTitan using modular helper
 * Called from success page after Stripe checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createMembershipSale } from '@/server/lib/membershipSales';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const requestSchema = z.object({
  sessionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    const { sessionId } = result.data;

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const metadata = session.metadata!;
    
    if (metadata.type !== 'portal_membership_purchase') {
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 400 }
      );
    }

    const membershipTypeId = parseInt(metadata.membershipTypeId);
    const saleTaskId = parseInt(metadata.saleTaskId);
    const durationBillingId = parseInt(metadata.durationBillingId);
    const paymentIntentId = session.payment_intent as string;

    console.log(`[Portal Membership] Processing purchase for ${metadata.customerName}, membership type ${membershipTypeId}`);

    // Use modular createMembershipSale helper with flat structure
    const result_sale = await createMembershipSale({
      customerName: metadata.customerName,
      customerPhone: metadata.customerPhone,
      customerEmail: metadata.customerEmail,
      address: {
        street: metadata.address,
        city: metadata.city,
        state: metadata.state,
        zip: metadata.zip,
      },
      saleTaskId,
      durationBillingId,
      membershipTypeId,
      paymentIntentId,
      paymentAmount: session.amount_total || 0,
      utmSource: 'customer_portal',
    });

    if (!result_sale.success) {
      console.error(`[Portal Membership] Failed to create membership: ${result_sale.error}`);
      return NextResponse.json(
        {
          success: false,
          error: result_sale.error || 'Failed to create membership in ServiceTitan',
        },
        { status: 500 }
      );
    }

    console.log(`[Portal Membership] Successfully created membership ${result_sale.customerMembershipId} for customer ${result_sale.customerId}`);

    return NextResponse.json({
      success: true,
      membershipId: result_sale.customerMembershipId,
      customerId: result_sale.customerId,
      locationId: result_sale.locationId,
      invoiceId: result_sale.invoiceId,
      message: 'Membership purchased successfully!',
    });

  } catch (error: any) {
    console.error('[Portal Membership] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete membership purchase',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
