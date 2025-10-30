import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ referralId: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { referralId } = await params;
    const { status, creditNotes } = await req.json();
    
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    await db
      .update(referrals)
      .set({
        status,
        ...(creditNotes && { creditNotes }),
        lastUpdatedAt: new Date()
      })
      .where(eq(referrals.id, referralId));

    console.log(`[Referrals] Updated referral ${referralId} status to ${status}`);
    return NextResponse.json({ success: true, message: 'Referral updated successfully' });
  } catch (error: any) {
    console.error("[Referrals] Error updating referral:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
