import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { getPortalSession } from '@/server/lib/customer-portal/portal-session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params;
    
    // SECURITY: Validate session
    const { customerId, availableCustomerIds } = await getPortalSession();

    const { active } = await req.json();

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: active must be a boolean' },
        { status: 400 }
      );
    }

    // SECURITY: Verify location belongs to authenticated customer
    // Query ALL locations (active AND inactive) for proper ownership verification
    const locationIdNum = parseInt(locationId);
    const locationResponse = await serviceTitanAuth.makeRequest<any>(
      `crm/v2/tenant/${serviceTitanAuth.getTenantId()}/locations/${locationIdNum}`
    );
    
    // Verify this location belongs to one of the authorized customer accounts
    if (!locationResponse || !availableCustomerIds.includes(locationResponse.customerId)) {
      console.warn(`[Portal API] Customer ${customerId} attempted to access location ${locationId} without authorization`);
      return NextResponse.json({ error: 'Forbidden: Location not found' }, { status: 403 });
    }

    // Update location status in ServiceTitan
    await serviceTitanCRM.updateLocationStatus(locationIdNum, active);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Portal API] Error updating location status:', error);
    
    // Handle authentication/authorization errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden: Location not found' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update location status' },
      { status: 500 }
    );
  }
}
