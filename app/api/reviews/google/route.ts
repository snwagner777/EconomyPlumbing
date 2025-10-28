/**
 * Public API - Google Reviews
 * 
 * Get Google reviews for display on website
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const minRating = parseInt(searchParams.get('minRating') || '4', 10);

    const reviews = await storage.getPublishedGoogleReviews();
    
    // Filter and limit
    const filtered = reviews
      .filter(r => r.rating >= minRating)
      .slice(0, limit);

    return NextResponse.json({
      reviews: filtered,
      count: filtered.length,
    });
  } catch (error) {
    console.error('[Google Reviews API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
