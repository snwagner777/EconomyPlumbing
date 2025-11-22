import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const { availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(parseInt(customerId), availableCustomerIds);

    console.log(`[Portal] Fetching customer contacts for ${customerId}...`);

    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');

    const contactMethods = await serviceTitanCRM.getCustomerContacts(parseInt(customerId));

    return NextResponse.json({ contactMethods });
  } catch (error: any) {
    console.error('[Portal] Get customer contacts error:', error);
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch customer contacts' },
      { status: 500 }
    );
  }
}
