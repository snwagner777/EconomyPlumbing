/**
 * Admin API - Single Referral Management
 * 
 * Update or process individual referral
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const referralUpdateSchema = z.object({
  status: z.enum(['pending', 'validated', 'converted', 'credited', 'rejected']).optional(),
  notes: z.string().optional(),
  creditAmount: z.number().optional(),
  creditIssued: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = referralUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const [referral] = await db
      .update(referrals)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(referrals.id, parseInt(id, 10)))
      .returning();

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    return NextResponse.json({ referral });
  } catch (error) {
    console.error('[Admin Referral API] Error:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}
