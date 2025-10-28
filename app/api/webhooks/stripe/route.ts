/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe events: checkout.session.completed, payment_intent.succeeded, etc.
 * 
 * CRITICAL: Must use raw body for signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { storage } from '@/server/storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // Get raw body as text for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] No signature header');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Stripe Webhook] Event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe] Checkout session completed:', session.id);
  
  // Get customer details
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  
  if (!customerEmail) {
    console.error('[Stripe] No customer email in session');
    return;
  }

  // Get product details from metadata
  const metadata = session.metadata;
  const productSlug = metadata?.productSlug;
  
  if (!productSlug) {
    console.error('[Stripe] No product slug in metadata');
    return;
  }

  // Get product from database
  const product = await storage.getProductBySlug(productSlug);
  if (!product) {
    console.error('[Stripe] Product not found:', productSlug);
    return;
  }

  // Create pending purchase record
  await storage.createPendingPurchase({
    customerEmail,
    customerName: customerName || null,
    customerPhone: metadata?.phone || null,
    productId: product.id,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string || null,
    serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId,
    customerType: metadata?.customerType || 'residential',
    companyName: metadata?.companyName || null,
    contactPersonName: metadata?.contactPersonName || null,
    locationPhone: metadata?.locationPhone || null,
    locationEmail: metadata?.locationEmail || null,
    locationAddress: metadata?.locationAddress || null,
    locationCity: metadata?.locationCity || null,
    locationState: metadata?.locationState || null,
    locationZip: metadata?.locationZip || null,
    billingAddress: metadata?.billingAddress || null,
    billingCity: metadata?.billingCity || null,
    billingState: metadata?.billingState || null,
    billingZip: metadata?.billingZip || null,
    amount: session.amount_total ? session.amount_total / 100 : 0,
    paymentIntentId: session.payment_intent as string || '',
  });

  console.log('[Stripe] Pending purchase created for:', customerEmail);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Stripe] Payment intent succeeded:', paymentIntent.id);
  
  // Update pending purchase status if needed
  const purchase = await storage.getPendingPurchaseByPaymentIntent(paymentIntent.id);
  if (purchase) {
    console.log('[Stripe] Found pending purchase for payment intent:', paymentIntent.id);
    // Update purchase status or trigger membership sync
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Stripe] Payment intent failed:', paymentIntent.id);
  
  // Log failed payment for investigation
  const purchase = await storage.getPendingPurchaseByPaymentIntent(paymentIntent.id);
  if (purchase) {
    console.error('[Stripe] Payment failed for purchase:', purchase.id);
    // Could send notification email to admin
  }
}
