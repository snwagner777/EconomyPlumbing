import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { referrerSuccessEmails } from '@shared/schema';
import { desc } from 'drizzle-orm';

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

    const emails = await db
      .select()
      .from(referrerSuccessEmails)
      .orderBy(desc(referrerSuccessEmails.createdAt));

    return NextResponse.json(emails);
  } catch (error: any) {
    console.error("[Referral Emails] Error fetching success emails:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
