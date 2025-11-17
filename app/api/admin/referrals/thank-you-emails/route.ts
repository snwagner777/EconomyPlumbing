import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { referrerThankYouEmails } from '@shared/schema';
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
      .from(referrerThankYouEmails)
      .orderBy(desc(referrerThankYouEmails.createdAt));

    return NextResponse.json(emails);
  } catch (error: any) {
    console.error("[Referral Emails] Error fetching thank you emails:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
