import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { emailSendLog } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
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
    
    // Build query
    let query = db
      .select({
        campaignType: emailSendLog.campaignType,
        totalSent: sql<number>`count(*)`,
        totalOpened: sql<number>`count(*) filter (where ${emailSendLog.openedAt} is not null)`,
        totalClicked: sql<number>`count(*) filter (where ${emailSendLog.clickedAt} is not null)`,
        avgTimeToOpen: sql<number>`avg(extract(epoch from (${emailSendLog.openedAt} - ${emailSendLog.sentAt})))`,
        avgTimeToClick: sql<number>`avg(extract(epoch from (${emailSendLog.clickedAt} - ${emailSendLog.sentAt})))`,
      })
      .from(emailSendLog);
    
    // Add date filter if not "all"
    if (daysNum !== null) {
      query = query.where(
        sql`${emailSendLog.sentAt} >= now() - interval '${sql.raw(daysNum.toString())} days'`
      ) as typeof query;
    }
    
    const stats = await query.groupBy(emailSendLog.campaignType);

    const formattedStats = stats.map(stat => ({
      campaignType: stat.campaignType,
      totalSent: Number(stat.totalSent),
      totalOpened: Number(stat.totalOpened),
      totalClicked: Number(stat.totalClicked),
      openRate: stat.totalSent > 0 
        ? ((Number(stat.totalOpened) / Number(stat.totalSent)) * 100).toFixed(1)
        : '0.0',
      clickRate: stat.totalSent > 0
        ? ((Number(stat.totalClicked) / Number(stat.totalSent)) * 100).toFixed(1)
        : '0.0',
      avgTimeToOpen: stat.avgTimeToOpen ? Math.round(Number(stat.avgTimeToOpen) / 3600) : null,
      avgTimeToClick: stat.avgTimeToClick ? Math.round(Number(stat.avgTimeToClick) / 3600) : null,
    }));

    return NextResponse.json({ 
      stats: formattedStats, 
      period: days === 'all' ? 'all time' : `${days} days` 
    });
  } catch (error: any) {
    console.error("[Admin] Error fetching campaign analytics by type:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
