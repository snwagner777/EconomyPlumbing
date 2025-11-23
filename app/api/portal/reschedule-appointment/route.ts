import { NextRequest, NextResponse } from 'next/server';
import { getPortalSession } from '@/server/lib/customer-portal/portal-session';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Validate session first
    const { customerId, availableCustomerIds } = await getPortalSession();

    const { appointmentId, jobId, start, end, arrivalWindowStart, arrivalWindowEnd, specialInstructions } = await req.json();

    // Support legacy field names (newStart/newEnd) for backwards compatibility
    const newStart = start;
    const newEnd = end;

    if (!appointmentId || !newStart || !newEnd) {
      return NextResponse.json(
        { error: "Missing required fields: appointmentId, start, end" },
        { status: 400 }
      );
    }
    
    console.log(`[Portal] Reschedule request:`, { 
      appointmentId, 
      jobId, 
      newStart, 
      newEnd,
      arrivalWindowStart,
      arrivalWindowEnd,
      customerId 
    });

    console.log(`[Portal] Reschedule request for appointment ${appointmentId} by customer ${customerId}`);

    // SECURITY: Fetch appointment details to verify ownership
    const { serviceTitanAuth } = await import('@/server/lib/servicetitan/auth');
    const tenantId = serviceTitanAuth.getTenantId();
    
    const appointment = await serviceTitanAuth.makeRequest<any>(
      `jpm/v2/tenant/${tenantId}/appointments/${appointmentId}`
    );

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // SECURITY: Get the job to verify customer ownership
    const job = await serviceTitanAuth.makeRequest<any>(
      `jpm/v2/tenant/${tenantId}/jobs/${appointment.jobId}`
    );

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // SECURITY: Verify this customer owns this job
    if (!availableCustomerIds.includes(job.customerId)) {
      console.error(`[Portal] Security violation: Customer ${customerId} attempted to reschedule appointment ${appointmentId} owned by customer ${job.customerId}`);
      return NextResponse.json(
        { error: "Unauthorized - This appointment does not belong to you" },
        { status: 403 }
      );
    }

    // SECURITY: Check appointment status - cannot reschedule certain statuses
    const restrictedStatuses = ['Completed', 'Canceled', 'Invoiced'];
    if (restrictedStatuses.includes(appointment.status)) {
      return NextResponse.json(
        { error: `Cannot reschedule ${appointment.status.toLowerCase()} appointments. Please call us for assistance.` },
        { status: 400 }
      );
    }

    // Use ServiceTitan PATCH /appointments/{id}/reschedule endpoint
    const reschedulePayload = {
      start: newStart,
      end: newEnd,
      ...(arrivalWindowStart && { arrivalWindowStart }),
      ...(arrivalWindowEnd && { arrivalWindowEnd }),
    };

    console.log(`[Portal] Calling ServiceTitan PATCH /appointments/${appointmentId}/reschedule with payload:`, reschedulePayload);

    const updatedAppointment = await serviceTitanAuth.makeRequest<any>(
      `jpm/v2/tenant/${tenantId}/appointments/${appointmentId}/reschedule`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reschedulePayload),
      }
    );

    // Update special instructions if provided (separate API call)
    if (specialInstructions) {
      try {
        await serviceTitanAuth.makeRequest<any>(
          `jpm/v2/tenant/${tenantId}/appointments/${appointmentId}/special-instructions`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ specialInstructions }),
          }
        );
        console.log(`[Portal] Updated special instructions for appointment ${appointmentId}`);
      } catch (error) {
        console.error(`[Portal] Failed to update special instructions:`, error);
        // Don't fail the entire reschedule if special instructions update fails
      }
    }

    console.log(`[Portal] Appointment ${appointmentId} rescheduled successfully for customer ${customerId}`, {
      newStart,
      newEnd,
      arrivalWindowStart,
      arrivalWindowEnd
    });

    return NextResponse.json({ 
      success: true, 
      appointment: updatedAppointment,
      message: "Appointment rescheduled successfully"
    });
  } catch (error: any) {
    console.error("[Portal] Reschedule appointment error:", error);
    
    // Handle session errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: "Unauthorized - This appointment does not belong to you" },
        { status: 403 }
      );
    }
    
    // Check if it's an invoiced appointment error
    if (error.message && error.message.includes('invoice')) {
      return NextResponse.json({ 
        error: "This appointment cannot be rescheduled because it has been invoiced. Please call us to reschedule." 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "Failed to reschedule appointment. Please try again or call us for assistance." },
      { status: 500 }
    );
  }
}
