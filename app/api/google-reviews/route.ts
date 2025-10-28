/**
 * Google Reviews API - Get All Reviews
 * 
 * Returns all Google reviews (4+ stars) for display on website
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const reviews = await storage.getGoogleReviews();
    
    // Filter for 4+ star reviews only (display-worthy)
    const displayReviews = reviews.filter(r => r.rating >= 4);
    
    return NextResponse.json({
      reviews: displayReviews,
      count: displayReviews.length,
    });
  } catch (error) {
    console.error('[Google Reviews] Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
