import { NextRequest, NextResponse } from 'next/server';
import { conversionEvents } from '@shared/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import { requireAdmin } from '@/server/lib/nextAuth';

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

    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');
    const source = req.nextUrl.searchParams.get('source');
    const utmCampaign = req.nextUrl.searchParams.get('utmCampaign');

    // Build query conditions
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(conversionEvents.createdAt, new Date(startDate)));
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(conversionEvents.createdAt, end));
    }
    
    if (source) {
      conditions.push(eq(conversionEvents.source, source));
    }
    
    if (utmCampaign) {
      conditions.push(eq(conversionEvents.utmCampaign, utmCampaign));
    }

    // Get conversion stats
    const stats = await db
      .select({
        eventType: conversionEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(conversionEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(conversionEvents.eventType);

    // Format response
    const result = {
      schedulerOpens: stats.find(s => s.eventType === 'scheduler_open')?.count || 0,
      phoneClicks: stats.find(s => s.eventType === 'phone_click')?.count || 0,
      formSubmissions: stats.find(s => s.eventType === 'form_submission')?.count || 0,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error getting conversion stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion stats" },
      { status: 500 }
    );
  }
}
