/**
 * Referral Landing Page Capture API
 * 
 * Captures referee contact info from referral landing page and redirects to scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { pendingReferrals, referralCodes } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const captureLandingSchema = z.object({
  referralCode: z.string(),
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  serviceInterest: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const body = await req.json();
    const data = captureLandingSchema.parse(body);

    // Look up the referrer from the referral code
    const [referrer] = await db
      .select({
        customerId: referralCodes.customerId,
        customerName: referralCodes.customerName,
      })
      .from(referralCodes)
      .where(eq(referralCodes.code, data.referralCode))
      .limit(1);

    if (!referrer) {
      return NextResponse.json(
        { message: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Generate unique tracking cookie/token
    const trackingCookie = `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create pending referral with 30-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [pendingReferral] = await db
      .insert(pendingReferrals)
      .values({
        referrerCustomerId: referrer.customerId,
        referrerName: referrer.customerName,
        refereeName: data.name,
        refereeEmail: data.email || null,
        refereePhone: data.phone || null,
        trackingCookie,
        expiresAt,
      })
      .returning();

    console.log(`[Referral Landing] Created pending referral ${pendingReferral.id} for referrer ${referrer.customerName} (Customer ID: ${referrer.customerId})`);

    // Build scheduler URL with pre-filled contact info and referral tracking
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plumbersthatcare.com';
    const params = new URLSearchParams({
      referral: trackingCookie,
      name: data.name,
      phone: data.phone,
      email: data.email,
    });
    
    if (data.serviceInterest) {
      params.set('service', data.serviceInterest);
    }

    const schedulerUrl = `${baseUrl}/schedule-appointment?${params.toString()}`;

    return NextResponse.json({
      success: true,
      schedulerUrl,
      trackingToken: trackingCookie,
    });

  } catch (error: any) {
    console.error('[Referral Landing API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error processing referral' },
      { status: 500 }
    );
  }
}
