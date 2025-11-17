/**
 * DISABLED: Backflow Testing Stripe Checkout API
 * 
 * Payment integrations have been removed from the scheduler.
 * This endpoint is no longer available.
 */

import { NextRequest, NextResponse } from 'next/server';

/* PAYMENT INTEGRATION DISABLED - Code commented out
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const checkoutSchema = z.object({
  deviceCount: z.number().int().min(1).max(20),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(1),
  // Booking data to complete after payment
  bookingData: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    requestedService: z.string(),
    preferredDate: z.string(),
    preferredTimeSlot: z.string(),
    arrivalWindowStart: z.string().optional(),
    arrivalWindowEnd: z.string().optional(),
    specialInstructions: z.string().optional(),
    promoCode: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
  }),
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
    const protocol = hostname.includes('localhost') ? 'http' : 'https';
    const amount = data.deviceCount * 12500; // $125.00 per device in cents

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Backflow Testing Service',
              description: `Certified backflow testing for ${data.deviceCount} device${data.deviceCount > 1 ? 's' : ''}`,
            },
            unit_amount: 12500, // $125.00 per device
          },
          quantity: data.deviceCount,
        },
      ],
      success_url: `${protocol}://${hostname}/scheduler/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${protocol}://${hostname}/schedule-appointment?payment_canceled=true`,
      customer_email: data.customerEmail,
      metadata: {
        type: 'backflow_testing',
        deviceCount: data.deviceCount.toString(),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        // Store booking data as JSON string (Stripe metadata has character limits)
        bookingData: JSON.stringify(data.bookingData),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[Backflow Checkout] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
*/

// Return 404 for all requests
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Payment integration disabled' },
    { status: 404 }
  );
}
