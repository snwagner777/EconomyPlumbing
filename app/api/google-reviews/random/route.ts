/**
 * Google Reviews API - Get Random Reviews
 * 
 * Returns random subset of reviews for homepage carousel
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get('count') || '5', 10);
    
    const reviews = await storage.getGoogleReviews();
    
    // Filter for 4+ star reviews
    const displayReviews = reviews.filter(r => r.rating >= 4);
    
    // Shuffle and take random subset
    const shuffled = displayReviews.sort(() => Math.random() - 0.5);
    const randomReviews = shuffled.slice(0, Math.min(count, shuffled.length));
    
    return NextResponse.json({
      reviews: randomReviews,
      count: randomReviews.length,
    });
  } catch (error) {
    console.error('[Google Reviews] Error fetching random reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
