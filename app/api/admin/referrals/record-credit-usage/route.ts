import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { referralCreditUsage } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { getReferralProcessor } = await import('@/server/lib/referralProcessor');
    
    // Validate request body
    const { customerId, jobId, jobNumber, amountUsed, usedAt } = await req.json();
    
    if (!customerId || !jobId || !jobNumber || !amountUsed) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if already recorded
    const existing = await db
      .select()
      .from(referralCreditUsage)
      .where(eq(referralCreditUsage.jobId, jobId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Credit usage for this job already recorded" },
        { status: 400 }
      );
    }

    // Record the usage
    await db.insert(referralCreditUsage).values({
      customerId: parseInt(customerId),
      jobId,
      jobNumber,
      amountUsed: Math.round(parseFloat(amountUsed) * 100), // Convert dollars to cents
      usedAt: usedAt ? new Date(usedAt) : new Date(),
    });

    // Update the customer's credit balance note
    const processor = getReferralProcessor();
    await processor.deductFromCreditNote(
      parseInt(customerId),
      parseFloat(amountUsed), // Amount in dollars
      jobNumber,
      usedAt ? new Date(usedAt) : new Date()
    );

    return NextResponse.json({ 
      message: "Credit usage recorded successfully",
      customerId,
      jobNumber,
      amountUsed
    });
  } catch (error: any) {
    console.error('[Admin] Error recording credit usage:', error);
    return NextResponse.json(
      { message: "Error recording credit usage", error: error.message },
      { status: 500 }
    );
  }
}
