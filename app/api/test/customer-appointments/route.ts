import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

export async function GET(request: NextRequest) {
  try {
    const customerId = 27881198;
    const tenantId = serviceTitanAuth.getTenantId();

    console.log(`[Test] Fetching appointments for customer ${customerId}`);

    // Test 1: Try to get jobs for this customer
    const jobsParams = new URLSearchParams({
      customerId: customerId.toString(),
      page: '1',
      pageSize: '50',
    });

    console.log(`[Test] Calling: jpm/v2/tenant/${tenantId}/jobs?${jobsParams.toString()}`);
    const jobsResponse = await serviceTitanAuth.makeRequest<{ data: any[]; hasMore: boolean; page: number; pageSize: number }>(
      `jpm/v2/tenant/${tenantId}/jobs?${jobsParams.toString()}`
    );

    console.log(`[Test] Jobs API response:`, JSON.stringify(jobsResponse, null, 2));

    // Test 2: For each job, get its appointments
    const jobsWithAppointments = [];
    
    for (const job of jobsResponse.data.slice(0, 3)) {
      console.log(`[Test] Fetching appointments for job ${job.id}`);
      
      const appointmentsParams = new URLSearchParams({
        jobId: job.id.toString(),
        page: '1',
        pageSize: '10',
      });

      try {
        const appointmentsResponse = await serviceTitanAuth.makeRequest<{ data: any[] }>(
          `jpm/v2/tenant/${tenantId}/appointments?${appointmentsParams.toString()}`
        );

        jobsWithAppointments.push({
          job,
          appointments: appointmentsResponse.data,
        });

        console.log(`[Test] Job ${job.id} appointments:`, JSON.stringify(appointmentsResponse.data, null, 2));
      } catch (error) {
        console.error(`[Test] Error fetching appointments for job ${job.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      customerId,
      totalJobs: jobsResponse.data.length,
      hasMore: jobsResponse.hasMore,
      sample: {
        jobs: jobsResponse.data.slice(0, 3),
        jobsWithAppointments: jobsWithAppointments,
      },
    });

  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || error.toString(),
    }, { status: 500 });
  }
}
