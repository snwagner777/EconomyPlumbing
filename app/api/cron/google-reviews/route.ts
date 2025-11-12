/**
 * Cron Endpoint: Google Reviews Refresh
 * 
 * Fetches latest Google reviews and saves new ones to database.
 * Schedule: Daily at 3:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { fetchGoogleReviews } from '@/server/lib/googleReviews';
import { storage } from '@/server/storage';
import type { InsertGoogleReview } from '@shared/schema';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Google Reviews: Starting...');
    const reviews = await fetchGoogleReviews();
    
    if (reviews.length === 0) {
      console.log('[Cron] Google Reviews: No new reviews');
      return NextResponse.json({ 
        success: true, 
        message: 'No new reviews found',
        newReviews: 0 
      });
    }

    const existingReviews = await storage.getGoogleReviews();
    const existingByContent = new Map(
      existingReviews.map(r => [`${r.text}:${r.timestamp}`, r])
    );

    const newReviews: InsertGoogleReview[] = [];
    for (const review of reviews) {
      if (review.rating < 4) continue;
      const key = `${review.text}:${review.timestamp}`;
      if (!existingByContent.has(key)) {
        newReviews.push(review);
      }
    }

    if (newReviews.length > 0) {
      await storage.saveGoogleReviews(newReviews);
      console.log(`[Cron] Google Reviews: Added ${newReviews.length} new reviews`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${reviews.length} reviews, added ${newReviews.length} new`,
      newReviews: newReviews.length 
    });
  } catch (error: any) {
    console.error('[Cron] Google Reviews: Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Google reviews', details: error.message },
      { status: 500 }
    );
  }
}
