import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    console.log(`[Portal API] Fetching appointments for customer ${customerId}`);

    const jobsWithAppointments = await serviceTitanJobs.getCustomerAppointments(customerId);
    
    // Get all unique location IDs from jobs
    const locationIds = [...new Set(jobsWithAppointments.map(job => job.locationId).filter(Boolean))];
    
    // Fetch location details for all unique locations
    const locationMap = new Map();
    for (const locationId of locationIds) {
      try {
        const location = await serviceTitanCRM.getLocation(locationId);
        if (location?.address) {
          const addressParts = [
            location.address.street,
            location.address.city,
            location.address.state,
            location.address.zip
          ].filter(Boolean);
          locationMap.set(locationId, addressParts.join(', '));
        }
      } catch (err) {
        console.warn(`[Portal API] Failed to fetch location ${locationId}:`, err);
      }
    }
    
    // Enrich jobs with location addresses
    const enrichedJobs = jobsWithAppointments.map(job => ({
      ...job,
      locationAddress: job.locationId ? (locationMap.get(job.locationId) || null) : null,
    }));

    console.log(`[Portal API] Returning ${enrichedJobs.length} jobs with appointments and ${locationMap.size} location addresses`);

    return NextResponse.json({
      success: true,
      data: enrichedJobs,
    });

  } catch (error: any) {
    console.error('[Portal API] Error fetching appointments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointments',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
