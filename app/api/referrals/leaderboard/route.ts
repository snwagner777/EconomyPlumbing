/**
 * Referral Leaderboard API
 * 
 * Displays top referrers (anonymized names)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { eq, sql, count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Get top referrers by counting successful referrals
    const leaderboard = await db
      .select({
        referrerName: referrals.referrerName,
        referralCount: count(referrals.id),
      })
      .from(referrals)
      .where(eq(referrals.status, 'credited'))
      .groupBy(referrals.referrerName)
      .orderBy(sql`count(${referrals.id}) DESC`)
      .limit(10);

    // Anonymize names (First name + Last initial)
    const anonymizedLeaderboard = leaderboard.map(entry => {
      const nameParts = entry.referrerName.trim().split(' ');
      const firstName = nameParts[0];
      const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] + '.' : '';
      return {
        name: `${firstName} ${lastInitial}`.trim(),
        referralCount: entry.referralCount,
      };
    });

    return NextResponse.json({ leaderboard: anonymizedLeaderboard });

  } catch (error: any) {
    console.error('[Referrals Leaderboard API] Error:', error);
    return NextResponse.json(
      { message: 'Error fetching leaderboard' },
      { status: 500 }
    );
  }
}
