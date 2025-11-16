import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { serviceTitanPortalService } from '@/server/lib/servicetitan/portal-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);
    
    if (!customerId || isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Valid customer ID required' },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate session
    const session = await getSession();

    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // SECURITY: Verify this customer is in the authorized list
    const availableCustomerIds = session.customerPortalAuth.availableCustomerIds || [session.customerPortalAuth.customerId];
    if (!availableCustomerIds.includes(customerId)) {
      console.error(`[Portal] Security violation: Customer ${session.customerPortalAuth.customerId} attempted to access data for customer ${customerId}`);
      return NextResponse.json(
        { error: 'Unauthorized - This account does not belong to you' },
        { status: 403 }
      );
    }
    
    // Fetch real-time customer data from ServiceTitan
    const customerData = await serviceTitanPortalService.getCustomerPortalData(customerId);
    
    return NextResponse.json(customerData);
  } catch (error: any) {
    console.error('[Portal Customer Data] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load customer data' },
      { status: 500 }
    );
  }
}
