import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
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

    console.log(`[Portal API] Returning ${jobsWithAppointments.length} jobs with appointments`);

    return NextResponse.json({
      success: true,
      data: jobsWithAppointments,
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
