import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customerDataImports } from '@/shared/schema';
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

    const imports = await db
      .select()
      .from(customerDataImports)
      .orderBy(sql`${customerDataImports.startedAt} DESC`)
      .limit(20);

    return NextResponse.json(imports);
  } catch (error: any) {
    console.error('[Admin] Error fetching customer imports:', error);
    return NextResponse.json(
      { message: "Error fetching customer imports" },
      { status: 500 }
    );
  }
}
