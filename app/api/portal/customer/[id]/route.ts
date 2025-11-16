import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';
import { serviceTitanPortalService } from '@/server/lib/servicetitan/portal-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestedCustomerId = parseInt(id);
    
    if (!requestedCustomerId || isNaN(requestedCustomerId)) {
      return NextResponse.json(
        { error: 'Valid customer ID required' },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate session and customer ownership
    const { customerId, availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(requestedCustomerId, availableCustomerIds);
    
    // Fetch real-time customer data from ServiceTitan
    const customerData = await serviceTitanPortalService.getCustomerPortalData(requestedCustomerId);
    
    return NextResponse.json(customerData);
  } catch (error: any) {
    console.error('[Portal Customer Data] Error:', error);
    
    // Handle session errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Unauthorized - This account does not belong to you' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to load customer data' },
      { status: 500 }
    );
  }
}
