/**
 * Public API - Review Feedback Submission
 * 
 * Handle customer review submissions from email campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { reviewFeedback } from '@shared/schema';
import { z } from 'zod';

const feedbackSchema = z.object({
  token: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  wouldRecommend: z.boolean().optional(),
  selectedPlatform: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { token, ...feedbackData } = result.data;

    // TODO: Validate token and get associated review request
    // TODO: Update review request status
    
    // Create feedback record
    const [feedback] = await db
      .insert(reviewFeedback)
      .values({
        ...feedbackData,
        submittedAt: new Date(),
      })
      .returning();

    // TODO: If rating >= 4, trigger referral nurture campaign enrollment
    // TODO: Send thank you email

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[Review Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
