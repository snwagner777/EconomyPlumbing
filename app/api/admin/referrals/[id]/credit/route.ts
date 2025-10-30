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
    const { amount, notes } = await req.json();

    // Update referral status
    await db
      .update(referrals)
      .set({
        status: 'credited',
        creditAmount: amount || 2500,
        creditedAt: new Date(),
        creditedBy: 'manual_admin',
        creditNotes: notes || 'Manually credited by admin'
      })
      .where(eq(referrals.id, id));

    console.log(`[Referrals] Manually credited referral ${id} for $${((amount || 2500) / 100).toFixed(2)}`);
    return NextResponse.json({ success: true, message: 'Referral credited successfully' });
  } catch (error: any) {
    console.error("[Referrals] Error crediting referral:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
