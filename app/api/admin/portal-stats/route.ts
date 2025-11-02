import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { db } from '@/server/db';
import { portalAnalytics } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Count total searches
    const totalSearchesResult = await db.select({ count: sql<number>`count(*)` })
      .from(portalAnalytics);
    const totalSearches = Number(totalSearchesResult[0]?.count || 0);

    // Count successful searches (found customers)
    const foundSearchesResult = await db.select({ count: sql<number>`count(*)` })
      .from(portalAnalytics)
      .where(sql`${portalAnalytics.found} = true`);
    const totalCustomers = Number(foundSearchesResult[0]?.count || 0);

    // Get recent searches (last 10)
    const recentSearches = await db.select({
      id: portalAnalytics.id,
      searchType: portalAnalytics.searchType,
      searchValue: portalAnalytics.searchValue,
      found: portalAnalytics.found,
      timestamp: portalAnalytics.timestamp,
    })
      .from(portalAnalytics)
      .orderBy(sql`${portalAnalytics.timestamp} DESC`)
      .limit(10);

    return NextResponse.json({
      totalSearches,
      totalCustomers,
      recentSearches,
    });
  } catch (error: any) {
    console.error("[Admin] Portal stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portal stats" },
      { status: 500 }
    );
  }
}
