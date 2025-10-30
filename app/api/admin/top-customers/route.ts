import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx } from '@/shared/schema';
import { desc, and, gte, sql } from 'drizzle-orm';
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

    const period = req.nextUrl.searchParams.get('period') || 'all';
    const requestedLimit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const limit = Math.min(Math.max(requestedLimit, 1), 100); // Clamp between 1-100
    
    // Calculate date threshold based on period
    let dateThreshold: Date | null = null;
    const now = new Date();
    
    if (period === '1year') {
      dateThreshold = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (period === '2years') {
      dateThreshold = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    } else if (period === '3years') {
      dateThreshold = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    }
    
    // Build query with optional date filter
    const conditions = [];
    conditions.push(sql`${customersXlsx.lifetimeValue} > 0`);
    
    if (dateThreshold) {
      conditions.push(gte(customersXlsx.lastServiceDate, dateThreshold));
    }
    
    const topCustomers = await db
      .select({
        id: customersXlsx.id,
        name: customersXlsx.name,
        lifetimeValue: customersXlsx.lifetimeValue,
        jobCount: customersXlsx.jobCount,
        lastServiceDate: customersXlsx.lastServiceDate,
        lastServiceType: customersXlsx.lastServiceType,
      })
      .from(customersXlsx)
      .where(and(...conditions))
      .orderBy(desc(customersXlsx.lifetimeValue))
      .limit(limit);

    return NextResponse.json({ topCustomers });
  } catch (error: any) {
    console.error('[Admin] Error fetching top customers:', error);
    return NextResponse.json(
      { message: "Error fetching top customers" },
      { status: 500 }
    );
  }
}
