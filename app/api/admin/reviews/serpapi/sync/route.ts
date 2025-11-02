import { NextRequest, NextResponse } from 'next/server';
import { fetchAllReviewsViaSerpApi } from '@/server/lib/serpApiReviews';
import { db } from '@/server/db';
import { googleReviews } from '@shared/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clearFirst = body.clearFirst === true;

    console.log('[Admin API] Manual SerpAPI sync triggered', clearFirst ? '(clearing old reviews first)' : '');
    
    // Clear old SerpAPI reviews if requested (preserve GMB API reviews)
    if (clearFirst) {
      console.log('[Admin API] Clearing SerpAPI reviews only (preserving GMB API reviews)...');
      const { or, eq } = await import('drizzle-orm');
      await db.delete(googleReviews).where(
        or(
          eq(googleReviews.source, 'google_serpapi'),
          eq(googleReviews.source, 'yelp'),
          eq(googleReviews.source, 'facebook')
        )
      );
      console.log('[Admin API] SerpAPI reviews cleared, GMB API reviews preserved');
    }

    const results = await fetchAllReviewsViaSerpApi();
    
    return NextResponse.json({
      success: results.success,
      cleared: clearFirst,
      newReviews: {
        google: results.google,
        yelp: results.yelp,
        facebook: results.facebook,
        total: results.google + results.yelp + results.facebook,
      },
      errors: results.errors,
    });
  } catch (error: any) {
    console.error('[Admin API] Error in manual SerpAPI sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync reviews' },
      { status: 500 }
    );
  }
}
