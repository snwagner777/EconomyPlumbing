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
        error: "INVALID_PRODUCT_TYPE",
        message: "This product is not available for direct purchase. Membership products only." 
      }, { status: 400 });
    }

    // Initialize Stripe with secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ 
        error: "STRIPE_NOT_CONFIGURED",
        message: "Payment processing is temporarily unavailable. Please contact us at (512) 368-9159." 
      }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Create payment intent with server-side pricing
    const amount = Math.round(product.price);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        productId: product.id,
        productName: product.name,
        customerEmail: customerInfo?.email || '',
        customerName: customerInfo?.name || '',
        customerPhone: customerInfo?.phone || '',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      productName: product.name,
    });
  } catch (error: any) {
    console.error("[Payment Intent] Error creating payment intent:", error);
    return NextResponse.json(
      { 
        error: "PAYMENT_INTENT_FAILED",
        message: error.message || "Failed to create payment intent" 
      },
      { status: 500 }
    );
  }
}
