/**
 * Google Reviews API - Get Review Statistics
 * 
 * Returns aggregate stats: total count, average rating, rating distribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const reviews = await storage.getGoogleReviews();
    
    // Calculate statistics
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    // Rating distribution (1-5 stars)
    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };
    
    return NextResponse.json({
      totalReviews,
      averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
      distribution,
      displayableReviews: reviews.filter(r => r.rating >= 4).length,
    });
  } catch (error) {
    console.error('[Google Reviews] Error calculating stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}
