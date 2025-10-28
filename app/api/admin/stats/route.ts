/**
 * Admin API - Dashboard Statistics
 * 
 * Get overview statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { customersXlsx, reviewRequests, referralNurtureCampaigns, blogPosts, contactSubmissions } from '@shared/schema';
import { sql, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get various counts in parallel
    const [
      [{ customerCount }],
      [{ activeReviewRequestCount }],
      [{ activeReferralCampaignCount }],
      [{ blogPostCount }],
      [{ recentContactsCount }],
    ] = await Promise.all([
      db.select({ customerCount: sql<number>`count(*)` }).from(customersXlsx),
      db.select({ activeReviewRequestCount: sql<number>`count(*)` })
        .from(reviewRequests)
        .where(sql`${reviewRequests.status} IN ('active', 'pending')`),
      db.select({ activeReferralCampaignCount: sql<number>`count(*)` })
        .from(referralNurtureCampaigns)
        .where(sql`${referralNurtureCampaigns.status} = 'active'`),
      db.select({ blogPostCount: sql<number>`count(*)` }).from(blogPosts),
      db.select({ recentContactsCount: sql<number>`count(*)` })
        .from(contactSubmissions)
        .where(gte(contactSubmissions.submittedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
    ]);

    return NextResponse.json({
      stats: {
        totalCustomers: Number(customerCount),
        activeReviewRequests: Number(activeReviewRequestCount),
        activeReferralCampaigns: Number(activeReferralCampaignCount),
        totalBlogPosts: Number(blogPostCount),
        recentContacts: Number(recentContactsCount),
      },
    });
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
