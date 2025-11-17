import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { reviewRequests, referralNurtureCampaigns, emailSendLog } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days') || '30';
    
    // Validate days parameter
    const validDays = ['7', '30', '90', '365', 'all'];
    if (!validDays.includes(days)) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be 7, 30, 90, 365, or all' },
        { status: 400 }
      );
    }
    
    const daysNum = days === 'all' ? null : parseInt(days);
    
    // Build review requests query
    let reviewQuery = db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        paused: sql<number>`count(*) filter (where status = 'paused')`,
        totalOpens: sql<number>`sum(${reviewRequests.emailOpens})`,
        totalClicks: sql<number>`sum(${reviewRequests.linkClicks})`,
      })
      .from(reviewRequests);
    
    if (daysNum !== null) {
      reviewQuery = reviewQuery.where(
        sql`${reviewRequests.createdAt} >= now() - interval '${sql.raw(daysNum.toString())} days'`
      ) as typeof reviewQuery;
    }
    
    // Build referral nurture query
    let referralQuery = db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        paused: sql<number>`count(*) filter (where status = 'paused')`,
        totalOpens: sql<number>`sum(${referralNurtureCampaigns.totalOpens})`,
        totalClicks: sql<number>`sum(${referralNurtureCampaigns.totalClicks})`,
      })
      .from(referralNurtureCampaigns);
    
    if (daysNum !== null) {
      referralQuery = referralQuery.where(
        sql`${referralNurtureCampaigns.createdAt} >= now() - interval '${sql.raw(daysNum.toString())} days'`
      ) as typeof referralQuery;
    }
    
    // Build email stats query
    let emailQuery = db
      .select({
        totalSent: sql<number>`count(*)`,
        totalOpened: sql<number>`count(*) filter (where ${emailSendLog.openedAt} is not null)`,
        totalClicked: sql<number>`count(*) filter (where ${emailSendLog.clickedAt} is not null)`,
        totalBounced: sql<number>`count(*) filter (where ${emailSendLog.bouncedAt} is not null)`,
        totalComplained: sql<number>`count(*) filter (where ${emailSendLog.complainedAt} is not null)`,
      })
      .from(emailSendLog);
    
    if (daysNum !== null) {
      emailQuery = emailQuery.where(
        sql`${emailSendLog.sentAt} >= now() - interval '${sql.raw(daysNum.toString())} days'`
      ) as typeof emailQuery;
    }
    
    // Execute queries
    const [reviewStats] = await reviewQuery;
    const [referralStats] = await referralQuery;
    const [emailStats] = await emailQuery;

    return NextResponse.json({
      reviewRequests: {
        total: Number(reviewStats?.total || 0),
        completed: Number(reviewStats?.completed || 0),
        paused: Number(reviewStats?.paused || 0),
        openRate: reviewStats?.totalOpens && reviewStats?.total 
          ? (Number(reviewStats.totalOpens) / (Number(reviewStats.total) * 4) * 100).toFixed(1)
          : '0.0',
        clickRate: reviewStats?.totalClicks && reviewStats?.total
          ? (Number(reviewStats.totalClicks) / (Number(reviewStats.total) * 4) * 100).toFixed(1)
          : '0.0',
      },
      referralNurture: {
        total: Number(referralStats?.total || 0),
        completed: Number(referralStats?.completed || 0),
        paused: Number(referralStats?.paused || 0),
        openRate: referralStats?.totalOpens && referralStats?.total
          ? (Number(referralStats.totalOpens) / (Number(referralStats.total) * 4) * 100).toFixed(1)
          : '0.0',
        clickRate: referralStats?.totalClicks && referralStats?.total
          ? (Number(referralStats.totalClicks) / (Number(referralStats.total) * 4) * 100).toFixed(1)
          : '0.0',
      },
      emailStats: {
        totalSent: Number(emailStats?.totalSent || 0),
        totalOpened: Number(emailStats?.totalOpened || 0),
        totalClicked: Number(emailStats?.totalClicked || 0),
        totalBounced: Number(emailStats?.totalBounced || 0),
        totalComplained: Number(emailStats?.totalComplained || 0),
        openRate: emailStats?.totalSent && emailStats?.totalOpened
          ? (Number(emailStats.totalOpened) / Number(emailStats.totalSent) * 100).toFixed(1)
          : '0.0',
        clickRate: emailStats?.totalSent && emailStats?.totalClicked
          ? (Number(emailStats.totalClicked) / Number(emailStats.totalSent) * 100).toFixed(1)
          : '0.0',
      },
    });
  } catch (error: any) {
    console.error("[Admin] Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
