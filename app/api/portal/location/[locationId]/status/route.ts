import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/server/types/iron-session';
import { cookies } from 'next/headers';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { locationId } = await params;
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    // Verify this location belongs to the authenticated customer
    if (!locationResponse || locationResponse.customerId !== session.customerId) {
      console.warn(`[Portal API] Customer ${session.customerId} attempted to access location ${locationId} without authorization`);
      return NextResponse.json({ error: 'Forbidden: Location not found' }, { status: 403 });
    }

    // Update location status in ServiceTitan
    await serviceTitanCRM.updateLocationStatus(locationIdNum, active);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Portal API] Error updating location status:', error);
    return NextResponse.json(
      { error: 'Failed to update location status' },
      { status: 500 }
    );
  }
}
