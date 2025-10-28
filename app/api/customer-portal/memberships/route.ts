/**
 * Customer Portal API - Memberships
 * 
 * Get customer's VIP membership status and history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { serviceTitanMemberships } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.customerPortalAuth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;

    // Get all memberships for this customer
    const memberships = await db
      .select()
      .from(serviceTitanMemberships)
      .where(eq(serviceTitanMemberships.serviceTitanCustomerId, customerId))
      .orderBy(desc(serviceTitanMemberships.createdAt));

    // Get active membership (if any)
    const activeMembership = memberships.find(
      m => m.status === 'active' || m.status === 'pending'
    );

    return NextResponse.json({
      memberships,
      activeMembership: activeMembership || null,
      hasActiveMembership: !!activeMembership,
    });
  } catch (error) {
    console.error('[Customer Portal Memberships API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    );
  }
}
