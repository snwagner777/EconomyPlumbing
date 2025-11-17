import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { portalAnalytics } from '@shared/schema';
import { sql, and, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    // Check admin authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parallel queries for all analytics data
    const [
      totalSearchesResult,
      successfulSearchesResult,
      failedSearchesResult,
      uniqueCustomersResult,
      phoneSearchesResult,
      emailSearchesResult,
      recentSearches,
      failedSearches,
    ] = await Promise.all([
      // Total searches
      db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics),
      
      // Successful searches (found = true)
      db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.found} = true`),
      
      // Failed searches (found = false)
      db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.found} = false`),
      
      // Unique customers found (distinct customer IDs)
      db.select({ count: sql<number>`count(DISTINCT ${portalAnalytics.customerId})` })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.customerId} IS NOT NULL`),
      
      // Phone searches
      db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.searchType} = 'phone'`),
      
      // Email searches
      db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.searchType} = 'email'`),
      
      // Recent searches (last 50)
      db.select({
        id: portalAnalytics.id,
        searchType: portalAnalytics.searchType,
        searchValue: portalAnalytics.searchValue,
        found: portalAnalytics.found,
        customerId: portalAnalytics.customerId,
        timestamp: portalAnalytics.timestamp,
      })
        .from(portalAnalytics)
        .orderBy(sql`${portalAnalytics.timestamp} DESC`)
        .limit(50),
      
      // Failed searches (for lead follow-up, last 100)
      db.select({
        id: portalAnalytics.id,
        searchType: portalAnalytics.searchType,
        searchValue: portalAnalytics.searchValue,
        found: portalAnalytics.found,
        timestamp: portalAnalytics.timestamp,
      })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.found} = false`)
        .orderBy(sql`${portalAnalytics.timestamp} DESC`)
        .limit(100),
    ]);

    // Extract counts
    const totalSearches = Number(totalSearchesResult[0]?.count || 0);
    const successfulSearches = Number(successfulSearchesResult[0]?.count || 0);
    const failedSearchesCount = Number(failedSearchesResult[0]?.count || 0);
    const uniqueCustomers = Number(uniqueCustomersResult[0]?.count || 0);
    const phoneSearches = Number(phoneSearchesResult[0]?.count || 0);
    const emailSearches = Number(emailSearchesResult[0]?.count || 0);

    // Calculate success rate
    const successRate = totalSearches > 0
      ? (successfulSearches / totalSearches) * 100
      : 0;

    // Get daily trends for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyTrendsRaw = await db.select({
      date: sql<string>`DATE(${portalAnalytics.timestamp})`,
      searches: sql<number>`count(*)`,
      successful: sql<number>`count(*) FILTER (WHERE ${portalAnalytics.found} = true)`,
      failed: sql<number>`count(*) FILTER (WHERE ${portalAnalytics.found} = false)`,
    })
      .from(portalAnalytics)
      .where(gte(portalAnalytics.timestamp, sevenDaysAgo))
      .groupBy(sql`DATE(${portalAnalytics.timestamp})`)
      .orderBy(sql`DATE(${portalAnalytics.timestamp}) DESC`)
      .limit(7);

    // Format daily trends
    const dailyTrends = dailyTrendsRaw.map(day => ({
      date: day.date,
      searches: Number(day.searches),
      successful: Number(day.successful),
      failed: Number(day.failed),
    }));

    return NextResponse.json({
      totalSearches,
      successfulSearches,
      failedSearches: failedSearchesCount,
      uniqueCustomers,
      successRate,
      phoneSearches,
      emailSearches,
      recentSearches: recentSearches.map(search => ({
        ...search,
        searchType: search.searchType as 'phone' | 'email',
        timestamp: search.timestamp.toISOString(),
      })),
      failedSearchesList: failedSearches.map(search => ({
        ...search,
        searchType: search.searchType as 'phone' | 'email',
        timestamp: search.timestamp.toISOString(),
      })),
      dailyTrends,
    });
  } catch (error: any) {
    console.error("[Admin] Portal analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch portal analytics" },
      { status: 500 }
    );
  }
}
