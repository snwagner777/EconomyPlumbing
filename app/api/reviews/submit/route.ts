/**
 * Review Submission API
 * 
 * Handles custom review submissions with spam protection
 * Auto-creates referral nurture campaigns for 4+ star reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { z } from 'zod';

const reviewSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10),
  serviceTitanCustomerId: z.number().optional(),
  requestId: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  // Honeypot fields
  website: z.string().optional(),
  url: z.string().optional(),
});

// Rate limiting (in-memory, could be Redis in production)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const now = Date.now();

    // Spam protection: Rate limiting per IP
    const lastSubmission = rateLimitMap.get(clientIp);
    if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_WINDOW) {
      console.log('[Spam] Rate limit exceeded for review from IP:', clientIp);
      return NextResponse.json(
        { message: 'Too many submissions. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check
    if (body.website || body.url) {
      console.log('[Spam] Honeypot triggered for review from IP:', clientIp);
      return NextResponse.json(
        { message: 'Invalid form submission' },
        { status: 400 }
      );
    }

    // Validate input
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Missing required fields', details: result.error.errors },
        { status: 400 }
      );
    }

    const { website, url, ...reviewData } = result.data;

    // Insert review into database
    const review = await storage.createCustomReview({
      ...reviewData,
      email: reviewData.email || null,
      phone: reviewData.phone || null,
      serviceTitanCustomerId: reviewData.serviceTitanCustomerId || null,
      requestId: reviewData.requestId || null,
      photoUrls: reviewData.photoUrls || [],
      ipAddress: clientIp,
      userAgent: userAgent,
      status: 'pending', // All reviews start as pending moderation
      source: reviewData.requestId ? 'email_link' : 'website',
    });

    // Update rate limit tracking
    rateLimitMap.set(clientIp, now);

    console.log(`[Review] New submission from ${reviewData.customerName} (${review.rating} stars)`);

    // If 4+ star review AND we have customer email + ID, create referral nurture campaign
    if (review.rating >= 4 && reviewData.email && reviewData.serviceTitanCustomerId) {
      try {
        // Dynamic import to avoid circular dependencies
        const { getReferralNurtureScheduler } = await import('@/server/lib/referralNurtureScheduler');
        const scheduler = getReferralNurtureScheduler();

        const campaignId = await scheduler.createCampaignForReviewer(
          reviewData.serviceTitanCustomerId,
          reviewData.email,
          review.id
        );

        if (campaignId) {
          console.log(`[Review] Created referral nurture campaign ${campaignId} for ${reviewData.email}`);
        }
      } catch (campaignError: any) {
        // Don't fail the whole request if campaign creation fails
        console.error('[Review] Error creating referral campaign:', campaignError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your review! We appreciate your feedback.',
      reviewId: review.id,
    });

  } catch (error: any) {
    console.error('[Review Submit API] Error:', error);
    return NextResponse.json(
      { message: 'Error submitting review' },
      { status: 500 }
    );
  }
}
