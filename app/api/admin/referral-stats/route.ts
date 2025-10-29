import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referrals } from '@/shared/schema';
import { sql } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const stats = await db
      .select({
        status: referrals.status,
        count: sql<number>`count(*)::int`,
        totalCredits: sql<number>`sum(CASE WHEN ${referrals.status} = 'credited' THEN ${referrals.creditAmount} ELSE 0 END)::int`
      })
      .from(referrals)
      .groupBy(referrals.status);

    const totalReferrals = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalCreditsIssued = stats.reduce((sum, stat) => sum + (stat.totalCredits || 0), 0);

    return NextResponse.json({ 
      stats,
      totalReferrals,
      totalCreditsIssued: totalCreditsIssued / 100 // Convert cents to dollars
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching referral stats:', error);
    return NextResponse.json(
      { message: "Error fetching stats" },
      { status: 500 }
    );
  }
}
