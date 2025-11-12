/**
 * Memberships Types API (Public)
 * 
 * PUBLIC ENDPOINT - No authentication required
 * Fetches available membership types/plans for display on pricing pages, scheduler, etc.
 * 
 * MODULAR - Uses serviceTitanMemberships.getMembershipTypes()
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanMemberships } from '@/server/lib/servicetitan/memberships';

/**
 * GET /api/memberships/types
 * Get all active membership types with their details
 * 
 * Query params:
 * - active: boolean (default: true) - filter by active status
 * - includeDetails: boolean (default: false) - include discounts and recurring services
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active') !== 'false'; // Default to true
    const includeDetails = searchParams.get('includeDetails') === 'true';

    console.log(`[Memberships API] Fetching membership types (active: ${active}, includeDetails: ${includeDetails})`);

    // Fetch membership types
    const membershipTypes = await serviceTitanMemberships.getMembershipTypes({ active });

    // If includeDetails requested, fetch discounts and recurring services for each type
    if (includeDetails) {
      const typesWithDetails = await Promise.all(
        membershipTypes.map(async (type) => {
          try {
            const [discounts, recurringServices, billingOptions] = await Promise.all([
              serviceTitanMemberships.getMembershipDiscounts(type.id),
              serviceTitanMemberships.getRecurringServices(type.id),
              serviceTitanMemberships.getDurationBillingOptions(type.id),
            ]);

            return {
              ...type,
              discounts,
              recurringServices,
              billingOptions,
            };
          } catch (error) {
            console.error(`[Memberships API] Error fetching details for membership type ${type.id}:`, error);
            return {
              ...type,
              discounts: [],
              recurringServices: [],
              billingOptions: [],
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        membershipTypes: typesWithDetails,
      });
    }

    return NextResponse.json({
      success: true,
      membershipTypes,
    });

  } catch (error: any) {
    console.error('[Memberships API] Error fetching membership types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch membership types',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memberships/types
 * Refresh membership types cache from ServiceTitan
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Memberships API] Refreshing membership types cache');
    
    // Clear cache and fetch fresh data
    serviceTitanMemberships.clearCache();
    const membershipTypes = await serviceTitanMemberships.getMembershipTypes();

    return NextResponse.json({
      success: true,
      message: `Refreshed ${membershipTypes.length} membership types from ServiceTitan`,
      membershipTypes,
    });

  } catch (error: any) {
    console.error('[Memberships API] Error refreshing membership types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh membership types',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
