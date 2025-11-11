import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { customerIds } = await request.json();

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'customerIds array is required' },
        { status: 400 }
      );
    }

    console.log(`[Portal] Fetching account summaries for ${customerIds.length} customers`);

    // Fetch basic customer data for all IDs in parallel
    const accountPromises = customerIds.map(async (id) => {
      try {
        const customer = await serviceTitanCRM.getCustomer(id);
        const locations = await serviceTitanCRM.getCustomerLocations(id);
        
        return {
          id: customer.id,
          name: customer.name,
          type: customer.type || 'Residential',
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          locationCount: locations.length,
          primaryLocationId: locations[0]?.id || null,
        };
      } catch (error) {
        console.error(`[Portal] Error fetching account ${id}:`, error);
        return {
          id,
          name: `Account #${id}`,
          type: 'Unknown',
          email: null,
          phoneNumber: null,
          locationCount: 0,
          primaryLocationId: null,
        };
      }
    });

    const accounts = await Promise.all(accountPromises);

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('[Portal] Error fetching customer accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer accounts' },
      { status: 500 }
    );
  }
}
