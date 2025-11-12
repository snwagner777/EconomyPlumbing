/**
 * Customer Portal - Memberships API
 * 
 * AUTHENTICATED ENDPOINT - Requires customer login via phone-based SMS 2FA
 * Allows customers to view their active/expired memberships, benefits, and renewal options
 * 
 * Security: ServiceTitan v2 API as single source of truth, session-based authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanMemberships } from '@/server/lib/servicetitan/memberships';
import { logCustomerAction, extractTraceId } from '@/server/lib/auditLog';

/**
 * GET /api/customer-portal/memberships
 * Retrieve customer's memberships (active, expired, etc.)
 * 
 * Security: Validates session, returns only the authenticated user's memberships
 */
export async function GET(req: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    console.log(`[Customer Portal] Fetching memberships for customer ${customerId}`);

    // Fetch all memberships for this customer (active + expired)
    const allMemberships = await serviceTitanMemberships.getCustomerMemberships(customerId);

    // Separate active and expired
    const activeMemberships = allMemberships.filter(m => m.status === 'Active');
    const expiredMemberships = allMemberships.filter(m => m.status === 'Expired');
    const otherMemberships = allMemberships.filter(m => m.status !== 'Active' && m.status !== 'Expired');

    // For each active membership, fetch its benefits (discounts + recurring services)
    const membershipsWithBenefits = await Promise.all(
      activeMemberships.map(async (membership) => {
        try {
          const [discounts, recurringServices] = await Promise.all([
            serviceTitanMemberships.getMembershipDiscounts(membership.membershipTypeId),
            serviceTitanMemberships.getRecurringServices(membership.membershipTypeId),
          ]);

          return {
            ...membership,
            benefits: {
              discounts,
              recurringServices,
            },
          };
        } catch (error) {
          console.error(`[Customer Portal] Error fetching benefits for membership ${membership.id}:`, error);
          return {
            ...membership,
            benefits: {
              discounts: [],
              recurringServices: [],
            },
          };
        }
      })
    );

    // Audit log - Note: Current audit log doesn't have VIEW_MEMBERSHIPS action type
    // Just log to console for now
    console.log(`[Customer Portal] Customer ${customerId} viewed memberships - Active: ${activeMemberships.length}, Expired: ${expiredMemberships.length}`);

    return NextResponse.json({
      success: true,
      memberships: {
        active: membershipsWithBenefits,
        expired: expiredMemberships,
        other: otherMemberships,
      },
    });

  } catch (error: any) {
    console.error('[Customer Portal] Get memberships error:', error);
    const traceId = extractTraceId(error);
    return NextResponse.json(
      { code: 'FETCH_FAILED', message: 'Failed to retrieve memberships', traceId },
      { status: 500 }
    );
  }
}
