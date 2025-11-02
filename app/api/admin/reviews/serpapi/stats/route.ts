import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { googleReviews } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Get review counts by source
    const reviewCounts = await db
      .select({
        source: googleReviews.source,
        count: sql<number>`count(*)::int`,
        avgRating: sql<number>`avg(${googleReviews.rating})::numeric(3,2)`,
        latestReview: sql<Date>`max(${googleReviews.fetchedAt})`,
      })
      .from(googleReviews)
      .where(sql`${googleReviews.source} IN ('google_serpapi', 'yelp', 'facebook')`)
      .groupBy(googleReviews.source);

    // Get total stats
    const totalStats = await db
      .select({
        total: sql<number>`count(*)::int`,
        avgRating: sql<number>`avg(${googleReviews.rating})::numeric(3,2)`,
        fiveStars: sql<number>`count(*) filter (where ${googleReviews.rating} = 5)::int`,
        fourStars: sql<number>`count(*) filter (where ${googleReviews.rating} = 4)::int`,
        threeStars: sql<number>`count(*) filter (where ${googleReviews.rating} = 3)::int`,
        twoStars: sql<number>`count(*) filter (where ${googleReviews.rating} = 2)::int`,
        oneStar: sql<number>`count(*) filter (where ${googleReviews.rating} = 1)::int`,
      })
      .from(googleReviews)
      .where(sql`${googleReviews.source} IN ('google_serpapi', 'yelp', 'facebook')`);

    // Get recent reviews (last 10)
    const recentReviews = await db
      .select({
        id: googleReviews.id,
        authorName: googleReviews.authorName,
        rating: googleReviews.rating,
        text: googleReviews.text,
        source: googleReviews.source,
        fetchedAt: googleReviews.fetchedAt,
      })
      .from(googleReviews)
      .where(sql`${googleReviews.source} IN ('google_serpapi', 'yelp', 'facebook')`)
      .orderBy(sql`${googleReviews.fetchedAt} DESC`)
      .limit(10);

    // Check if SerpAPI key is configured
    const serpApiConfigured = !!process.env.SERPAPI_API_KEY;

    // Format response
    const stats = {
      configured: serpApiConfigured,
      bySource: reviewCounts.map(row => ({
        source: row.source,
        count: Number(row.count),
        avgRating: Number(row.avgRating),
        latestFetch: row.latestReview,
      })),
      overall: totalStats[0] ? {
        total: Number(totalStats[0].total),
        avgRating: Number(totalStats[0].avgRating),
        breakdown: {
          5: Number(totalStats[0].fiveStars),
          4: Number(totalStats[0].fourStars),
          3: Number(totalStats[0].threeStars),
          2: Number(totalStats[0].twoStars),
          1: Number(totalStats[0].oneStar),
        },
      } : null,
      recent: recentReviews,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Admin API] Error fetching SerpAPI stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review stats' },
      { status: 500 }
    );
  }
}
