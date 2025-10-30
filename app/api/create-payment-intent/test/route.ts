import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const { productId, customerInfo } = await req.json();

    if (!productId) {
      return NextResponse.json({ 
        error: "MISSING_PRODUCT_ID",
        message: "Product ID is required" 
      }, { status: 400 });
    }

    // Get product details from database - NEVER trust client-side pricing
    const product = await storage.getProductById(productId);
    if (!product) {
      return NextResponse.json({ 
        error: "PRODUCT_NOT_FOUND",
        message: "Product not found" 
      }, { status: 404 });
    }

    // Verify product is active and available for purchase
    if (!product.active) {
      return NextResponse.json({ 
        error: "PRODUCT_UNAVAILABLE",
        message: "This product is no longer available for purchase" 
      }, { status: 400 });
    }

    // Verify this is a membership product (case-insensitive check)
    if (product.category.toLowerCase() !== 'membership') {
      return NextResponse.json({ 
        error: "NOT_A_MEMBERSHIP",
        message: "This product is not a VIP membership. Please use the store for other products." 
      }, { status: 400 });
    }

    // Initialize Stripe with TEST keys
    const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Missing required Stripe test secret: TESTING_STRIPE_SECRET_KEY');
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
    });

    // Product price is already stored in cents in the database
    const amountInCents = product.price;

    if (amountInCents <= 0) {
      return NextResponse.json({ 
        error: "INVALID_PRICE",
        message: "Product has an invalid price" 
      }, { status: 400 });
    }

    // Create payment intent with server-side validated pricing
    const metadata = {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      category: product.category,
      sku: product.sku || '',
      serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId || '',
      durationBillingId: product.durationBillingId || '',
      testMode: "true", // Mark this as a test transaction
      // Customer type and identification
      customerType: customerInfo?.customerType || '',
      customerName: customerInfo?.locationName || '',
      companyName: customerInfo?.companyName || '',
      contactPersonName: customerInfo?.contactPersonName || '',
      locationName: customerInfo?.locationName || '',
      // Contact info
      email: customerInfo?.email || '',
      phone: customerInfo?.phone || '',
      locationPhone: customerInfo?.locationPhone || '',
      extension: customerInfo?.extension || '',
      // Location address
      street: customerInfo?.street || '',
      city: customerInfo?.city || '',
      state: customerInfo?.state || '',
      zip: customerInfo?.zip || '',
      // Billing address
      billingName: customerInfo?.billingName || '',
      billingStreet: customerInfo?.billingStreet || '',
      billingCity: customerInfo?.billingCity || '',
      billingState: customerInfo?.billingState || '',
      billingZip: customerInfo?.billingZip || '',
    };

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
      description: `Test Mode - ${product.name}`,
    });

    console.log('[Stripe Test] Payment intent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      productId: product.id,
      productName: product.name,
      amount: amountInCents,
      testMode: true
    });
  } catch (error: any) {
    console.error("[Stripe Test] Error creating payment intent:", error);
    return NextResponse.json(
      { 
        error: error.type || "STRIPE_ERROR",
        message: error.message || "Failed to create payment intent" 
      },
      { status: 500 }
    );
  }
}
