import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { googleReviews } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const source = body.source; // Optional: clear specific source only
    
    if (source) {
      console.log(`[Admin API] Clearing ${source} reviews only...`);
      const { eq } = await import('drizzle-orm');
      await db.delete(googleReviews).where(eq(googleReviews.source, source));
      console.log(`[Admin API] ${source} reviews cleared`);
      
      return NextResponse.json({
        success: true,
        message: `${source} reviews cleared successfully`,
      });
    } else {
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
      
      return NextResponse.json({
        success: true,
        message: 'SerpAPI reviews cleared (GMB API reviews preserved)',
      });
    }
  } catch (error: any) {
    console.error('[Admin API] Error clearing reviews:', error);
    return NextResponse.json(
      { error: 'Failed to clear reviews' },
      { status: 500 }
    );
  }
}
