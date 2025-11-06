/**
 * Customer Portal API - Reschedule Appointment
 * 
 * Allows customers to reschedule their upcoming appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { db } from '@/server/db';
import { schedulerRequests } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const rescheduleSchema = z.object({
  appointmentId: z.number(),
  start: z.string().optional(), // ISO datetime
  end: z.string().optional(), // ISO datetime
  arrivalWindowStart: z.string().optional(), // ISO datetime
  arrivalWindowEnd: z.string().optional(), // ISO datetime
  specialInstructions: z.string().optional(),
  grouponVoucher: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.customerPortalAuth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { appointmentId, start, end, arrivalWindowStart, arrivalWindowEnd, specialInstructions, grouponVoucher } = rescheduleSchema.parse(body);

    const authenticatedCustomerId = session.customerPortalAuth.customerId;

    // CRITICAL: Verify appointment belongs to authenticated customer before rescheduling
    const appointment = await serviceTitanJobs.getAppointment(appointmentId);
    
    // Get job to verify customer ownership
    const job = await serviceTitanJobs.getJob(appointment.jobId);
    
    if (job.customerId !== authenticatedCustomerId) {
      console.warn(`[Customer Portal] Authorization failure: Customer ${authenticatedCustomerId} attempted to reschedule appointment ${appointmentId} belonging to customer ${job.customerId}`);
      return NextResponse.json(
        { error: 'Appointment not found' }, // Don't reveal whether appointment exists
        { status: 404 }
      );
    }

    // Build special instructions for appointment
    const instructionsParts: string[] = [];
    if (specialInstructions && specialInstructions.trim()) {
      instructionsParts.push(specialInstructions.trim());
    }
    if (grouponVoucher && grouponVoucher.trim()) {
      instructionsParts.push(`Groupon Voucher: ${grouponVoucher.trim()}`);
    }
    const combinedInstructions = instructionsParts.length > 0 
      ? instructionsParts.join('\n\n') 
      : undefined;

    // Reschedule appointment in ServiceTitan
    await serviceTitanJobs.rescheduleAppointment(appointmentId, {
      start,
      end,
      arrivalWindowStart,
      arrivalWindowEnd,
      specialInstructions: combinedInstructions,
    });

    // Update local database if this appointment was booked through scheduler
    if (start) {
      await db.update(schedulerRequests)
        .set({
          preferredDate: new Date(start),
          updatedAt: new Date(),
        })
        .where(eq(schedulerRequests.serviceTitanAppointmentId, appointmentId));
    }

    console.log(`[Customer Portal] Appointment ${appointmentId} rescheduled by customer ${authenticatedCustomerId}`);

    return NextResponse.json({
      success: true,
      message: 'Appointment rescheduled successfully',
    });
  } catch (error: any) {
    console.error('[Customer Portal Reschedule] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule appointment' },
      { status: 500 }
    );
  }
}
