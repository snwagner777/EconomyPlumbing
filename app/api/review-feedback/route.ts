/**
 * Review Feedback API - Rating-First Flow
 * 
 * Handles feedback from rating-first review request page
 * Auto-creates referral nurture campaigns for 4+ star ratings
 */

import { NextRequest, NextResponse } from 'next/server';
import { reviewFeedback } from '@shared/schema';
import { z } from 'zod';

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(1),
  reviewRequestId: z.string().optional(),
  customerId: z.number().optional(),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const body = await req.json();

    // Validate input
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Rating and feedback are required', details: result.error.errors },
        { status: 400 }
      );
    }

    const { rating, feedback: feedbackText, reviewRequestId, customerId, customerEmail } = result.data;

    // Insert feedback into database
    const [newFeedback] = await db
      .insert(reviewFeedback)
      .values({
        reviewRequestId: reviewRequestId || '',
        customerId: customerId || 0,
        rating,
        feedbackText,
        submittedAt: new Date(),
      })
      .returning();

    console.log(`[Review Feedback] Received ${rating}-star feedback from /request-review page`);

    // If 4+ star review AND we have customer email, create referral nurture campaign
    if (rating >= 4 && customerEmail && customerId) {
      try {
        const { getReferralNurtureScheduler } = await import('@/server/lib/referralNurtureScheduler');
        const scheduler = getReferralNurtureScheduler();

        const campaignId = await scheduler.createCampaignForReviewer(
          customerId,
          customerEmail,
          reviewRequestId || newFeedback.id
        );

        if (campaignId) {
          console.log(`[Review Feedback] Created referral nurture campaign ${campaignId} for ${customerEmail}`);
        }
      } catch (campaignError: any) {
        // Don't fail the whole request if campaign creation fails
        console.error('[Review Feedback] Error creating referral campaign:', campaignError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback. We'll use it to improve our service.",
      feedbackId: newFeedback.id
    });

  } catch (error: any) {
    console.error('[Review Feedback API] Error:', error);
    return NextResponse.json(
      { message: 'Error submitting feedback: ' + error.message },
      { status: 500 }
    );
  }
}
