import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customerDataImports } from '@/shared/schema';
import { sql } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
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
