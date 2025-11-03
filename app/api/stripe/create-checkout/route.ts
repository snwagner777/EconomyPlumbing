/**
 * Stripe Checkout Session Creation API
 * 
 * Creates Stripe checkout session for product purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { storage } from '@/server/storage';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const checkoutSchema = z.object({
  productSlug: z.string(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  phone: z.string().optional(),
  customerType: z.enum(['residential', 'commercial']).optional(),
  companyName: z.string().optional(),
  contactPersonName: z.string().optional(),
  locationPhone: z.string().optional(),
  locationEmail: z.string().email().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationZip: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;
    const hostname = req.headers.get('host') || 'www.plumbersthatcare.com';

    // Get product from database
    const product = await storage.getProductBySlug(data.productSlug);
    if (!product || !product.active) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Ensure product has Stripe IDs
    if (!product.stripePriceId) {
      return NextResponse.json(
        { error: 'Product not configured for checkout' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: data.successUrl || `https://${hostname}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl || `https://${hostname}/store/canceled`,
      customer_email: data.customerEmail,
      metadata: {
        productSlug: data.productSlug,
        productId: product.id,
        phone: data.phone || '',
        customerType: data.customerType || 'residential',
        companyName: data.companyName || '',
        contactPersonName: data.contactPersonName || '',
        locationPhone: data.locationPhone || '',
        locationEmail: data.locationEmail || '',
        locationAddress: data.locationAddress || '',
        locationCity: data.locationCity || '',
        locationState: data.locationState || '',
        locationZip: data.locationZip || '',
        billingAddress: data.billingAddress || '',
        billingCity: data.billingCity || '',
        billingState: data.billingState || '',
        billingZip: data.billingZip || '',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[Stripe Checkout] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
