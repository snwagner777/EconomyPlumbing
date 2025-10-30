import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx, contactsXlsx } from '@/shared/schema';
import { sql } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { isSyncRunning } = await import('@/server/lib/serviceTitanSync');

    // Get customer and contact counts
    const [customerCount, contactCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customersXlsx),
      db.select({ count: sql<number>`count(*)` }).from(contactsXlsx)
    ]);

    // Get most recent sync timestamp
    const recentCustomer = await db.select({ lastSynced: customersXlsx.lastSyncedAt })
      .from(customersXlsx)
      .orderBy(sql`${customersXlsx.lastSyncedAt} DESC`)
      .limit(1);

    return NextResponse.json({
      totalCustomers: Number(customerCount[0]?.count || 0),
      totalContacts: Number(contactCount[0]?.count || 0),
      lastSyncedAt: recentCustomer[0]?.lastSynced || null,
      isRunning: isSyncRunning(),
    });
  } catch (error: any) {
    console.error("[Admin] Sync status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}
