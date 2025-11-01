import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const metrics = await db
      .select({
        totalCustomers: sql<number>`count(*)::int`,
        customersWithRevenue: sql<number>`count(CASE WHEN ${customersXlsx.lifetimeValue} > 0 THEN 1 END)::int`,
        totalLifetimeRevenue: sql<number>`COALESCE(sum(${customersXlsx.lifetimeValue}), 0)::bigint`,
        avgLifetimeRevenue: sql<number>`COALESCE(avg(${customersXlsx.lifetimeValue}), 0)::int`,
        maxLifetimeRevenue: sql<number>`COALESCE(max(${customersXlsx.lifetimeValue}), 0)::bigint`
      })
      .from(customersXlsx);

    return NextResponse.json(metrics[0] || {
      totalCustomers: 0,
      customersWithRevenue: 0,
      totalLifetimeRevenue: 0,
      avgLifetimeRevenue: 0,
      maxLifetimeRevenue: 0
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching customer metrics:', error);
    return NextResponse.json(
      { message: "Error fetching customer metrics" },
      { status: 500 }
    );
  }
}
