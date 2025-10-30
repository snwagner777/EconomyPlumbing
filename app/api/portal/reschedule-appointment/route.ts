import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, newStart, newEnd, customerId } = await req.json();

    if (!appointmentId || !newStart || !newEnd || !customerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[Portal] Reschedule request for appointment ${appointmentId}`);

    // Get ServiceTitan API
    const { ServiceTitanAPI } = await import("@/server/lib/serviceTitan");
    const serviceTitan = new ServiceTitanAPI({
      tenantId: process.env.SERVICETITAN_TENANT_ID!,
      clientId: process.env.SERVICETITAN_CLIENT_ID!,
      clientSecret: process.env.SERVICETITAN_CLIENT_SECRET!,
      appKey: process.env.SERVICETITAN_APP_KEY!,
    });

    // Reschedule the appointment
    const updatedAppointment = await serviceTitan.rescheduleAppointment(
      parseInt(appointmentId),
      newStart,
      newEnd
    );

    console.log(`[Portal] Appointment ${appointmentId} rescheduled successfully`);

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
