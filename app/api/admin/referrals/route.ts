/**
 * Admin API - Referral Management
 * 
 * View and manage customer referrals
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { referrals } from '@shared/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = db.select().from(referrals);
    
    if (status) {
      query = query.where(eq(referrals.status, status));
    }

    const allReferrals = await query
      .orderBy(desc(referrals.submittedAt))
      .limit(limit)
      .offset(offset);

    // Get count with same filter
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(referrals);
    if (status) {
      countQuery = countQuery.where(eq(referrals.status, status));
    }
    const [{ count }] = await countQuery;

    return NextResponse.json({
      referrals: allReferrals,
      total: Number(count),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Admin Referrals API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
