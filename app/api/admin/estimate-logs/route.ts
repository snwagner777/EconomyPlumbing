import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { estimateProcessingLog } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function GET(request: NextRequest) {
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
      .from(estimateProcessingLog)
      .orderBy(desc(estimateProcessingLog.receivedAt))
      .limit(50);

    return NextResponse.json({ 
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error('[Admin API] Error fetching estimate logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate logs' },
      { status: 500 }
    );
  }
}
