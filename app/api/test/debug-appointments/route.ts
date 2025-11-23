import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { cookies } from 'next/headers';

/**
 * DEBUG ENDPOINT: Show raw appointment/job data structure
 * This helps understand what fields are available from ServiceTitan
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    console.log(`\n[DEBUG] Fetching appointments for customer ${customerId}`);

    const jobsWithAppointments = await serviceTitanJobs.getCustomerAppointments(customerId);

    if (jobsWithAppointments.length === 0) {
      return NextResponse.json({
        message: 'No jobs found for this customer',
        customerId,
      });
    }

    // Extract all unique field names across all jobs
    const jobFields = new Set<string>();
    const appointmentFields = new Set<string>();

    jobsWithAppointments.forEach(job => {
      Object.keys(job).forEach(key => jobFields.add(key));
      if (job.appointments) {
        job.appointments.forEach(apt => {
          Object.keys(apt).forEach(key => appointmentFields.add(key));
        });
      }
    });

    // Get samples
    const firstJob = jobsWithAppointments[0];
    const firstAppointment = firstJob.appointments?.[0];

    return NextResponse.json({
      summary: {
        totalJobs: jobsWithAppointments.length,
        jobFields: Array.from(jobFields).sort(),
        appointmentFields: Array.from(appointmentFields).sort(),
        jobsWithAppointments: jobsWithAppointments.map(job => ({
          id: job.id,
          jobNumber: job.jobNumber,
          jobStatus: job.jobStatus,
          completedOn: job.completedOn,
          appointmentCount: job.appointments?.length || 0,
        })),
      },
      samples: {
        firstJob: firstJob ? {
          ...firstJob,
          appointments: firstJob.appointments?.slice(0, 1), // Just first appointment in sample
        } : null,
      },
      fullData: jobsWithAppointments, // Raw complete data
    });
  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch appointments',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
