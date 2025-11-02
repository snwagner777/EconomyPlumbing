import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { invoiceProcessingLog } from '@shared/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const logs = await db
      .select()
      .from(invoiceProcessingLog)
      .orderBy(desc(invoiceProcessingLog.receivedAt))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('[Admin API] Error fetching invoice logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice logs' },
      { status: 500 }
    );
  }
}
