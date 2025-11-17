import { NextRequest, NextResponse } from 'next/server';
import { customerDataImports } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/server/lib/nextAuth';

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

    const imports = await db
      .select()
      .from(customerDataImports)
      .orderBy(sql`${customerDataImports.startedAt} DESC`)
      .limit(50);

    return NextResponse.json({
      imports,
      count: imports.length,
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching customer imports:', error);
    return NextResponse.json(
      { message: "Error fetching customer imports" },
      { status: 500 }
    );
  }
}
