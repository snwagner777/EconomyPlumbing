/**
 * Public API - Referral Submission
 * 
 * Handle customer referral submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { z } from 'zod';

const referralSchema = z.object({
  referrerName: z.string().min(1).max(200),
  referrerEmail: z.string().email(),
  referrerPhone: z.string().optional(),
  refereeName: z.string().min(1).max(200),
  refereeEmail: z.string().email().optional(),
  refereePhone: z.string().min(1),
  refereeAddress: z.string().optional(),
  refereeCity: z.string().optional(),
  refereeState: z.string().optional(),
  refereeZip: z.string().optional(),
  serviceNeeded: z.string().optional(),
  notes: z.string().optional(),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour
    });
    return true;
  }

  if (limit.count >= 3) {
    return false; // Max 3 referrals per hour
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many referrals submitted. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = referralSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Create referral record
    const [referral] = await db
      .insert(referrals)
      .values({
        ...result.data,
        submittedAt: new Date(),
        status: 'pending',
      })
      .returning();

    // TODO: Send thank you email to referrer
    // TODO: Send welcome email to referee
    // TODO: Notify admin

    return NextResponse.json({
      success: true,
      message: 'Thank you for your referral! We will contact them soon.',
      referralId: referral.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[Referral Submission API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit referral' },
      { status: 500 }
    );
  }
}
