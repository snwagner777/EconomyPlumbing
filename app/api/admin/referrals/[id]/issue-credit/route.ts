import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';

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
    const { amount, memo } = await req.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Valid amount is required" },
        { status: 400 }
      );
    }

    // Get referral
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, parseInt(id, 10)))
      .limit(1);

    if (!referral) {
      return NextResponse.json(
        { message: "Referral not found" },
        { status: 404 }
      );
    }

    if (!referral.referrerCustomerId) {
      return NextResponse.json(
        { message: "No referrer customer ID found" },
        { status: 400 }
      );
    }

    // Issue credit via ServiceTitan API
    const serviceTitan = getServiceTitanAPI();
    
    const credit = await serviceTitan.createCustomerCredit(
      referral.referrerCustomerId,
      amount,
      memo || `Manual referral credit for ${referral.refereeName}`
    );

    // Update referral
    const [updatedReferral] = await db
      .update(referrals)
      .set({
        status: 'credited',
        creditedAt: new Date(),
        creditedBy: 'manual',
        creditAmount: amount,
        creditNotes: `Manual credit issued: ServiceTitan adjustment #${credit.id}`,
        updatedAt: new Date()
      })
      .where(eq(referrals.id, parseInt(id, 10)))
      .returning();

    return NextResponse.json({ referral: updatedReferral, credit });
  } catch (error: any) {
    console.error('[Admin] Error issuing credit:', error);
    return NextResponse.json(
      { message: "Error issuing credit: " + error.message },
      { status: 500 }
    );
  }
}
