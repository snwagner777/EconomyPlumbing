import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx } from '@/shared/schema';
import { desc, gt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10'), 50);

    const topCustomers = await db
      .select({
        name: customersXlsx.name,
        jobCount: customersXlsx.jobCount
      })
      .from(customersXlsx)
      .where(gt(customersXlsx.jobCount, 0))
      .orderBy(desc(customersXlsx.jobCount))
      .limit(limit);

    if (!topCustomers.length) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Anonymize names (First name + Last initial)
    const anonymizedLeaderboard = topCustomers.map(entry => {
      const nameParts = entry.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] + '.' : '';
      return {
        name: `${firstName} ${lastInitial}`.trim(),
        jobCount: entry.jobCount,
      };
    });

    console.log(`[Customers Leaderboard] ✅ Returning ${anonymizedLeaderboard.length} customers`);
    return NextResponse.json({ leaderboard: anonymizedLeaderboard });
  } catch (error: any) {
    console.error('[Customers] Error fetching leaderboard:', error);
    return NextResponse.json(
      { message: "Error fetching customer leaderboard" },
      { status: 500 }
    );
  }
}
