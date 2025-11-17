import { NextRequest, NextResponse } from 'next/server';
import { invoiceProcessingLog } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function GET(request: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const logs = await db
      .select()
      .from(invoiceProcessingLog)
      .orderBy(desc(invoiceProcessingLog.receivedAt))
      .limit(50);

    return NextResponse.json({ 
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error('[Admin API] Error fetching invoice logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice logs' },
      { status: 500 }
    );
  }
}
