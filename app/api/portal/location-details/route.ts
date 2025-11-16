import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanPortalService } from '@/server/lib/servicetitan/portal-service';
import { getPortalSession, assertCustomerOwnership } from '@/server/lib/customer-portal/portal-session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = parseInt(searchParams.get('customerId') || '0');
    const locationId = parseInt(searchParams.get('locationId') || '0');
    
    if (!customerId || isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Valid customer ID required' },
        { status: 400 }
      );
    }

    if (isNaN(locationId)) {
      return NextResponse.json(
        { error: 'Valid location ID required' },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate session and customer ownership
    const { availableCustomerIds } = await getPortalSession();
    assertCustomerOwnership(customerId, availableCustomerIds);
    
    // Fetch location details from ServiceTitan
    const locationDetails = await serviceTitanPortalService.getLocationDetails(customerId, locationId);
    
    return NextResponse.json(locationDetails);
  } catch (error: any) {
    console.error('[Portal Location Details] Error:', error);
    
    // Handle authentication/authorization errors
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
    
    // Return 403 for authorization errors (location doesn't belong to customer)
    if (error.message && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    // Return 404 for not found errors
    if (error.message && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    // Return 500 for other errors
    return NextResponse.json(
      { error: error.message || 'Failed to load location details' },
      { status: 500 }
    );
  }
}
