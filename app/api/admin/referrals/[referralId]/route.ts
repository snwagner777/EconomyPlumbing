import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { referrals } from '@/shared/schema';
import { eq } from 'drizzle-orm';
export async function PATCH(
  req: NextRequest,
  { params }: { params: { referralId: string } }
) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { referralId } = params;
    const { status, creditNotes } = await req.json();
    
    if (!status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (creditNotes) {
      updateData.creditNotes = creditNotes;
    }
    
    // If manually marking as credited, set credited timestamp
    if (status === 'credited' && !creditNotes) {
      updateData.creditedAt = new Date();
      updateData.creditedBy = 'manual';
    }

    const [updatedReferral] = await db
      .update(referrals)
      .set(updateData)
      .where(eq(referrals.id, referralId))
      .returning();

    if (!updatedReferral) {
      return NextResponse.json(
        { message: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ referral: updatedReferral });
  } catch (error: any) {
    console.error('[Admin] Error updating referral:', error);
    return NextResponse.json(
      { message: "Error updating referral" },
      { status: 500 }
    );
  }
}
