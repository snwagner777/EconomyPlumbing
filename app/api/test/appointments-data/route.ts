import { NextRequest, NextResponse } from 'next/server';

/**
 * TEST ENDPOINT: View appointment/job data structure from ServiceTitan API
 * This helps understand what fields are available for display
 * 
 * Usage: Call with customer session to see the data being returned
 */
export async function GET(request: NextRequest) {
  try {
    // Call the actual appointments endpoint with the session
    const appointmentsResponse = await fetch(
      `${request.nextUrl.origin}/api/customer-portal/appointments`,
      {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!appointmentsResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch appointments',
          status: appointmentsResponse.status,
        },
        { status: appointmentsResponse.status }
      );
    }

    const appointmentsData = await appointmentsResponse.json();

    // Log the structure for debugging
    console.log('\n=== APPOINTMENT DATA STRUCTURE ===\n');
    
    if (appointmentsData.data && Array.isArray(appointmentsData.data)) {
      console.log(`Total jobs: ${appointmentsData.data.length}`);
      
      if (appointmentsData.data.length > 0) {
        const firstJob = appointmentsData.data[0];
        console.log('\nFirst job object keys:');
        console.log(Object.keys(firstJob).sort());
        
        console.log('\nFirst job full data:');
        console.log(JSON.stringify(firstJob, null, 2));
        
        if (firstJob.appointments && Array.isArray(firstJob.appointments) && firstJob.appointments.length > 0) {
          console.log('\nFirst appointment object keys:');
          console.log(Object.keys(firstJob.appointments[0]).sort());
          
          console.log('\nFirst appointment full data:');
          console.log(JSON.stringify(firstJob.appointments[0], null, 2));
        }
      }
    }

    // Return formatted data for web viewing
    return NextResponse.json({
      summary: {
        totalJobs: appointmentsData.data?.length || 0,
        jobFields: appointmentsData.data?.length > 0 ? Object.keys(appointmentsData.data[0]).sort() : [],
        appointmentFields: appointmentsData.data?.[0]?.appointments?.[0] 
          ? Object.keys(appointmentsData.data[0].appointments[0]).sort() 
          : [],
      },
      rawData: appointmentsData.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Test endpoint failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
