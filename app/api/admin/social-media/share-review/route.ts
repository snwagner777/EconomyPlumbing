/**
 * Share Review to Social Media API
 * 
 * Shares a Google review to social media platforms via Late API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { shareReviewToSocial } from '@/server/lib/late-api';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { reviewText, reviewerName, rating, platforms, imageUrl, scheduledFor } = body;

    // Validation
    if (!reviewText || !reviewerName || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewText, reviewerName, rating' },
        { status: 400 }
      );
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform must be selected' },
        { status: 400 }
      );
    }

    console.log(`[Social Media] Sharing review to ${platforms.length} platform(s)...`);

    // Share the review to social media
    const result = await shareReviewToSocial({
      reviewText,
      reviewerName,
      rating,
      platforms,
      imageUrl,
      scheduledFor,
    });

    console.log(`[Social Media] Review shared successfully:`, {
      postId: result.id,
      status: result.status,
      platforms: result.platforms,
    });

    return NextResponse.json({
      success: true,
      postId: result.id,
      status: result.status,
      platforms: result.platforms,
    });

  } catch (error: any) {
    console.error('[Social Media] Share review error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to share review to social media',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
