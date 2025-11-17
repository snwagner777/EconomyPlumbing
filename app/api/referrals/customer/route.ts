/**
 * GET /api/referrals/customer
 * 
 * Retrieves a customer's referral history including:
 * - People they've referred
 * - Referral status (pending, contacted, job_completed, credited)
 * - Reward amounts and credit status
 */

import { NextRequest, NextResponse } from 'next/server';
import { referrals } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get('customerId');
    
    if (!customerIdParam) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }
    
    const customerId = parseInt(customerIdParam);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customerId parameter' },
        { status: 400 }
      );
    }
    
    // Fetch all referrals made by this customer
    const customerReferrals = await db.query.referrals.findMany({
      where: eq(referrals.referrerCustomerId, customerId),
      orderBy: [desc(referrals.submittedAt)],
    });
    
    // Format referral data for the customer portal
    const formattedReferrals = customerReferrals.map(referral => ({
      id: referral.id,
      refereeName: referral.refereeName,
      refereePhone: referral.refereePhone,
      refereeEmail: referral.refereeEmail,
      status: referral.status,
      submittedAt: referral.submittedAt,
      contactedAt: referral.contactedAt,
      firstJobDate: referral.firstJobDate,
      firstJobAmount: referral.firstJobAmount,
      creditAmount: referral.creditAmount,
      creditedAt: referral.creditedAt,
      expiresAt: referral.expiresAt,
      creditNotes: referral.creditNotes,
    }));
    
    // Calculate summary statistics
    const totalReferrals = customerReferrals.length;
    const pendingReferrals = customerReferrals.filter(r => r.status === 'pending').length;
    const completedReferrals = customerReferrals.filter(
      r => r.status === 'job_completed' || r.status === 'credited'
    ).length;
    const totalCreditsEarned = customerReferrals
      .filter(r => r.status === 'credited')
      .reduce((sum, r) => sum + (r.creditAmount || 0), 0);
    
    return NextResponse.json({
      referrals: formattedReferrals,
      summary: {
        total: totalReferrals,
        pending: pendingReferrals,
        completed: completedReferrals,
        totalCreditsEarned, // in cents
      },
    });
  } catch (error) {
    console.error('[Referral Customer API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve referral history' },
      { status: 500 }
    );
  }
}
