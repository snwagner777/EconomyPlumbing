import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { reason } = await req.json();

    await db
      .update(referrals)
      .set({
        status: 'ineligible',
        creditNotes: reason || 'Marked ineligible by admin'
      })
      .where(eq(referrals.id, id));

    console.log(`[Referrals] Marked referral ${id} as ineligible: ${reason}`);
    return NextResponse.json({ success: true, message: 'Referral marked as ineligible' });
  } catch (error: any) {
    console.error("[Referrals] Error marking referral ineligible:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
