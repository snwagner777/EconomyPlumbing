import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const reviews = await storage.getGoogleReviews();
    
    if (reviews.length === 0) {
      // Cache empty result for 5 minutes only
      return NextResponse.json(
        {
          ratingValue: null,
          reviewCount: 0
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, must-revalidate'
          }
        }
      );
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / reviews.length).toFixed(1);
    
    // Cache stats for 30 minutes (same as reviews)
    return NextResponse.json(
      {
        ratingValue: avgRating,
        reviewCount: reviews.length
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=1800, must-revalidate'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch review stats" },
      { status: 500 }
    );
  }
}
