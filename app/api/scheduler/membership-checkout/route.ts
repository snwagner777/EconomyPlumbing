import { db } from '@/server/db';
import { products } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const checkoutSchema = z.object({
  membershipId: z.string(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  location: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  service: z.object({
    name: z.string(),
    category: z.string(),
  }),
  preferredDate: z.string().optional(),
  preferredTimeSlot: z.string().optional(),
  specialInstructions: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referralCode: z.string().optional(),
  referralDiscount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Fetch membership product from database
    const [membership] = await db.select()
      .from(products)
      .where(eq(products.slug, data.membershipId))
      .limit(1);

    if (!membership || membership.category !== 'membership') {
      return NextResponse.json(
        { error: 'Invalid membership selected' },
        { status: 400 }
      );
    }

    // SECURITY: Validate ServiceTitan IDs BEFORE creating checkout
    // This prevents customers from paying for misconfigured memberships
    const saleTaskId = membership.sku ? parseInt(membership.sku) : 0;
    const durationBillingId = membership.durationBillingId ? parseInt(membership.durationBillingId) : 0;

    if (!saleTaskId || isNaN(saleTaskId) || !durationBillingId || isNaN(durationBillingId)) {
      console.error(`[Membership Checkout] Product ${membership.slug} missing ServiceTitan IDs - SKU: ${membership.sku}, DurationBillingId: ${membership.durationBillingId}`);
      return NextResponse.json(
        { 
          error: 'This membership is not properly configured. Please contact support.',
          details: 'Missing ServiceTitan integration IDs (saleTaskId or durationBillingId)'
        },
        { status: 500 }
      );
    }

    const hostname = req.headers.get('host') || 'www.plumbersthatcare.com';
    const protocol = hostname.includes('localhost') ? 'http' : 'https';

    // Apply referral discount if applicable
    const finalAmount = Math.max(
      0,
      membership.price - (data.referralDiscount || 0) * 100
    );

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: membership.name,
              description: membership.description || 'VIP Membership',
              images: membership.image ? [membership.image] : undefined,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${protocol}://${hostname}/scheduler/membership-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${protocol}://${hostname}/schedule-appointment?payment_canceled=true`,
      customer_email: data.customerEmail,
      metadata: {
        type: 'vip_membership',
        membershipId: data.membershipId,
        membershipName: membership.name,
        // ServiceTitan IDs for createMembershipSale() - validated above
        saleTaskId: saleTaskId.toString(),
        durationBillingId: durationBillingId.toString(),
        serviceTitanMembershipTypeId: membership.serviceTitanMembershipTypeId || '',
        // Referral info
        referralCode: data.referralCode || '',
        referralDiscount: data.referralDiscount?.toString() || '0',
        // Customer/booking data
        bookingData: JSON.stringify({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          location: data.location,
          service: data.service,
          preferredDate: data.preferredDate,
          preferredTimeSlot: data.preferredTimeSlot,
          specialInstructions: data.specialInstructions,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign,
        }),
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating membership checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
