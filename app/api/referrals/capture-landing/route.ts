/**
 * Referral Landing Page Capture API
 * 
 * Captures referee contact info from referral landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pendingReferrals, customersXlsx } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

const captureLandingSchema = z.object({
  referrerCustomerId: z.number(),
  refereeName: z.string().min(2),
  refereeEmail: z.string().email().optional(),
  refereePhone: z.string().min(10).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = captureLandingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Missing required fields', details: result.error.errors },
        { status: 400 }
      );
    }

    const { referrerCustomerId, refereeName, refereeEmail, refereePhone } = result.data;

    if (!refereeEmail && !refereePhone) {
      return NextResponse.json(
        { message: 'Either email or phone is required' },
        { status: 400 }
      );
    }

    // Get referrer info
    const [referrer] = await db
      .select({
        name: customersXlsx.name,
      })
      .from(customersXlsx)
      .where(sql`${customersXlsx.id} = ${referrerCustomerId}`)
      .limit(1);

    if (!referrer) {
      return NextResponse.json(
        { message: 'Referrer not found' },
        { status: 404 }
      );
    }

    // Create pending referral with expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Generate tracking cookie
    const trackingCookie = `ref_${referrerCustomerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const [pendingReferral] = await db.insert(pendingReferrals).values({
      referrerCustomerId,
      referrerName: referrer.name,
      refereeName,
      refereeEmail: refereeEmail || null,
      refereePhone: refereePhone || null,
      trackingCookie,
      expiresAt,
    }).returning();

    console.log(`[Referral] Created pending referral ${pendingReferral.id} - Referrer: ${referrer.name}, Referee: ${refereeName}`);

    return NextResponse.json({
      success: true,
      message: 'Contact information captured successfully',
      trackingCookie,
    });

  } catch (error: any) {
    console.error('[Referral Capture Landing API] Error:', error);
    return NextResponse.json(
      { message: 'Error capturing contact information' },
      { status: 500 }
    );
  }
}
