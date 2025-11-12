/**
 * Public Membership Purchase Completion
 * 
 * Handles successful Stripe payments from public /membership-benefits page
 * Creates membership in ServiceTitan using modular helper
 * 
 * Flow: Phone lookup → Stripe checkout → This handler → ServiceTitan membership
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createMembershipSale } from '@/server/lib/membershipSales';
import { db } from '@/server/db';
import { products } from '@shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const requestSchema = z.object({
  paymentIntentId: z.string(),
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

    const { paymentIntentId } = result.data;

    console.log(`[Public Membership] Processing completion for payment ${paymentIntentId}`);

    // Retrieve payment intent to verify payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify this is a public membership purchase (metadata check)
    const metadata = paymentIntent.metadata;
    if (metadata.type !== 'public_membership_purchase') {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      );
    }

    // SECURITY: Use product slug from Stripe metadata, not client params
    const productSlug = metadata.productSlug;
    if (!productSlug) {
      return NextResponse.json(
        { error: 'Missing product information in payment' },
        { status: 400 }
      );
    }

    // Get product details (including ServiceTitan IDs)
    const product = await db.query.products.findFirst({
      where: eq(products.slug, productSlug),
    });

    if (!product || product.category !== 'membership') {
      return NextResponse.json(
        { error: 'Invalid product' },
        { status: 400 }
      );
    }

    if (!product.serviceTitanMembershipTypeId || !product.durationBillingId) {
      return NextResponse.json(
        { error: 'Product missing ServiceTitan configuration' },
        { status: 500 }
      );
    }

    // Convert ServiceTitan IDs from string to number
    const membershipTypeId = parseInt(product.serviceTitanMembershipTypeId);
    const durationBillingId = parseInt(product.durationBillingId);

    // Extract customer data from payment intent billing/shipping
    const billing = paymentIntent.billing_details || paymentIntent.charges.data[0]?.billing_details;
    const shipping = paymentIntent.shipping || paymentIntent.charges.data[0]?.shipping;
    
    if (!billing?.phone) {
      return NextResponse.json(
        { error: 'Missing customer phone in payment' },
        { status: 400 }
      );
    }

    const customerName = billing.name || shipping?.name || 'Web Customer';
    const customerEmail = billing.email || undefined;
    const customerPhone = billing.phone.replace(/\D/g, '');
    
    // Prefer shipping address, fallback to billing
    const addressSource = shipping?.address || billing.address;
    const address = {
      street: addressSource?.line1 || 'To be provided',
      city: addressSource?.city || 'Austin',
      state: addressSource?.state || 'TX',
      zip: addressSource?.postal_code || '78701',
    };

    console.log(`[Public Membership] Creating membership for ${customerName}, phone: ${customerPhone}`);

    // Use modular createMembershipSale helper with flat structure
    const saleResult = await createMembershipSale({
      customerName,
      customerPhone,
      customerEmail,
      address,
      saleTaskId: membershipTypeId, // Use membership type ID as sale task
      durationBillingId,
      membershipTypeId,
      paymentIntentId,
      paymentAmount: paymentIntent.amount,
      utmSource: 'website',
    });

    if (!saleResult.success) {
      console.error(`[Public Membership] Failed to create membership: ${saleResult.error}`);
      return NextResponse.json(
        {
          success: false,
          error: saleResult.error || 'Failed to create membership in ServiceTitan',
        },
        { status: 500 }
      );
    }

    console.log(`[Public Membership] Successfully created membership ${saleResult.customerMembershipId} for customer ${saleResult.customerId}`);

    return NextResponse.json({
      success: true,
      membershipId: saleResult.customerMembershipId,
      customerId: saleResult.customerId,
      locationId: saleResult.locationId,
      invoiceId: saleResult.invoiceId,
      message: 'Membership purchased successfully!',
    });

  } catch (error: any) {
    console.error('[Public Membership] Error:', error);
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
