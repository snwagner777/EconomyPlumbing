import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Validate session first
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerId) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { appointmentId, jobId, newStart, newEnd, technicianId } = await req.json();

    if (!appointmentId || !newStart || !newEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    console.log(`[Portal] Reschedule request:`, { 
      appointmentId, 
      jobId, 
      newStart, 
      newEnd, 
      technicianId,
      customerId: session.customerId 
    });

    console.log(`[Portal] Reschedule request for appointment ${appointmentId} by customer ${session.customerId}`);

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
    const availableCustomerIds = session.availableCustomerIds || [session.customerId];
    if (!availableCustomerIds.includes(job.customerId)) {
      console.error(`[Portal] Security violation: Customer ${session.customerId} attempted to reschedule appointment ${appointmentId} owned by customer ${job.customerId}`);
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

    // Get ServiceTitan API
    const { ServiceTitanAPI } = await import("@/server/lib/serviceTitan");
    const serviceTitan = new ServiceTitanAPI({
      tenantId: process.env.SERVICETITAN_TENANT_ID!,
      clientId: process.env.SERVICETITAN_CLIENT_ID!,
      clientSecret: process.env.SERVICETITAN_CLIENT_SECRET!,
      appKey: process.env.SERVICETITAN_APP_KEY!,
    });

    // Reschedule the appointment with optional technician assignment
    const updatedAppointment = await serviceTitan.rescheduleAppointment(
      parseInt(appointmentId),
      newStart,
      newEnd,
      technicianId ? parseInt(technicianId) : undefined
    );

    console.log(`[Portal] Appointment ${appointmentId} rescheduled successfully for customer ${session.customerId}`, {
      newStart,
      newEnd,
      technicianId
    });

    return NextResponse.json({ 
      success: true, 
      appointment: updatedAppointment,
      message: "Appointment rescheduled successfully"
    });
  } catch (error: any) {
    console.error("[Portal] Reschedule appointment error:", error);
    
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
