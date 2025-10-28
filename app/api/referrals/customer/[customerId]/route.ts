/**
 * Customer Referrals API
 * 
 * Fetches all referrals for a specific customer (as referrer or referee)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { eq, or, sql } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const customerIdNum = parseInt(customerId);

    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Get referrals where customer is either the referrer or referee
    const customerReferrals = await db
      .select()
      .from(referrals)
      .where(
        or(
          eq(referrals.referrerCustomerId, customerIdNum),
          eq(referrals.refereeCustomerId, customerIdNum)
        )
      )
      .orderBy(sql`${referrals.submittedAt} DESC`);

    return NextResponse.json({ referrals: customerReferrals });

  } catch (error: any) {
    console.error('[Customer Referrals API] Error:', error);
    return NextResponse.json(
      { message: 'Error fetching referrals' },
      { status: 500 }
    );
  }
}
