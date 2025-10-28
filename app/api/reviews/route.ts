/**
 * Reviews API - Combined Reviews
 * 
 * Fetches and merges Google reviews + custom reviews for display
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const featured = searchParams.get('featured') === 'true';
    const category = searchParams.get('category') || undefined;
    const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined;

    // Get both Google reviews and custom reviews
    const [googleReviews, customReviews] = await Promise.all([
      storage.getGoogleReviews(),
      storage.getApprovedReviews({ limit: undefined, featured })
    ]);

    // Map custom reviews to GoogleReview format for unified display
    const mappedCustomReviews = customReviews.map((review) => ({
      id: review.id,
      authorName: review.customerName,
      authorUrl: null,
      profilePhotoUrl: review.photoUrls && review.photoUrls.length > 0 ? review.photoUrls[0] : null,
      rating: review.rating,
      text: review.text || '',
      relativeTime: `${Math.floor((Date.now() - new Date(review.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
      timestamp: Math.floor(new Date(review.submittedAt).getTime() / 1000),
      categories: [] as string[],
      source: 'custom_review',
      reviewId: review.id,
    }));

    // Merge and sort all reviews by timestamp (newest first)
    let allReviews = [...googleReviews, ...mappedCustomReviews].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // Apply category filter if provided
    if (category) {
      allReviews = allReviews.filter(review =>
        review.categories && Array.isArray(review.categories) && review.categories.includes(category)
      );
    }

    // Apply minimum rating filter if provided
    if (minRating) {
      allReviews = allReviews.filter(review => review.rating >= minRating);
    }

    // Apply limit if provided
    if (limit) {
      allReviews = allReviews.slice(0, limit);
    }

    return NextResponse.json(allReviews);
  } catch (error: any) {
    console.error('[Reviews API] Error fetching reviews:', error);
    return NextResponse.json(
      { message: 'Error fetching reviews' },
      { status: 500 }
    );
  }
}
