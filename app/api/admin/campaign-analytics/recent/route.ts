import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { emailSendLog } from '@shared/schema';
import { sql, desc } from 'drizzle-orm';

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
    const limit = searchParams.get('limit') || '50';
    const days = searchParams.get('days') || '30';
    
    // Validate days parameter
    const validDays = ['7', '30', '90', '365', 'all'];
    if (!validDays.includes(days)) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be 7, 30, 90, 365, or all' },
        { status: 400 }
      );
    }
    
    // Validate and parse limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 1000' },
        { status: 400 }
      );
    }
    
    const daysNum = days === 'all' ? null : parseInt(days);
    
    // Build query
    let query = db
      .select()
      .from(emailSendLog);
    
    // Add date filter if not "all"
    if (daysNum !== null) {
      query = query.where(
        sql`${emailSendLog.sentAt} >= now() - interval '${sql.raw(daysNum.toString())} days'`
      ) as typeof query;
    }
    
    const recentEmails = await query
      .orderBy(desc(emailSendLog.sentAt))
      .limit(limitNum);

    return NextResponse.json({ emails: recentEmails });
  } catch (error: any) {
    console.error("[Admin] Error fetching recent campaign activity:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
