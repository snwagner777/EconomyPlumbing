/**
 * Scheduler Booking API
 * 
 * Handles appointment booking requests and creates jobs in ServiceTitan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { schedulerRequests, insertSchedulerRequestSchema } from '@shared/schema';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request data
    const validated = insertSchedulerRequestSchema.parse({
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      address: body.address,
      city: body.city,
      state: body.state || 'TX',
      zipCode: body.zipCode,
      requestedService: body.requestedService,
      preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
      preferredTimeSlot: body.preferredTimeSlot,
      specialInstructions: body.specialInstructions,
      bookingSource: body.bookingSource || 'website',
      status: 'pending',
    });

    // Create scheduler request record
    const [schedulerRequest] = await db.insert(schedulerRequests).values(validated).returning();

    try {
      // Step 1: Ensure customer exists in ServiceTitan
      console.log(`[Scheduler] Creating/finding customer for ${validated.customerName}`);
      const customer = await serviceTitanCRM.ensureCustomer({
        name: validated.customerName,
        phone: validated.customerPhone,
        email: validated.customerEmail || undefined,
        address: {
          street: validated.address,
          city: validated.city || 'Austin',
          state: validated.state || 'TX',
          zip: validated.zipCode || '78701',
        },
      });

      // Step 2: Ensure location exists for customer
      console.log(`[Scheduler] Creating/finding location for customer ${customer.id}`);
      const location = await serviceTitanCRM.ensureLocation(customer.id, {
        customerId: customer.id,
        address: {
          street: validated.address,
          city: validated.city || 'Austin',
          state: validated.state || 'TX',
          zip: validated.zipCode || '78701',
        },
        phone: validated.customerPhone,
        email: validated.customerEmail || undefined,
      });

      // Step 3: Create job with appointment
      // TODO: Get businessUnitId and jobTypeId from service mapping
      // For now, using placeholder values - will need to configure these
      const businessUnitId = 1; // Replace with actual business unit ID
      const jobTypeId = 1; // Replace with actual job type ID

      console.log(`[Scheduler] Creating job for ${validated.requestedService}`);
      const job = await serviceTitanJobs.createJob({
        customerId: customer.id,
        locationId: location.id,
        businessUnitId,
        jobTypeId,
        summary: `${validated.requestedService} - Booked via website`,
        preferredDate: validated.preferredDate || undefined,
        preferredTimeSlot: validated.preferredTimeSlot as any,
        specialInstructions: validated.specialInstructions || undefined,
      });

      // Update scheduler request with ServiceTitan IDs
      await db.update(schedulerRequests)
        .set({
          serviceTitanCustomerId: customer.id,
          serviceTitanLocationId: location.id,
          serviceTitanJobId: job.id,
          serviceTitanAppointmentId: job.firstAppointmentId,
          status: 'confirmed',
          bookedAt: new Date(),
          updatedAt: new Date(),
        })
        .where({ id: schedulerRequest.id });

      console.log(`[Scheduler] Successfully booked job ${job.jobNumber}`);

      return NextResponse.json({
        success: true,
        requestId: schedulerRequest.id,
        jobNumber: job.jobNumber,
        jobId: job.id,
        appointmentId: job.firstAppointmentId,
        message: `Appointment successfully scheduled! Job #${job.jobNumber}`,
      });

    } catch (error: any) {
      console.error('[Scheduler] Booking failed:', error);

      // Update scheduler request with error
      await db.update(schedulerRequests)
        .set({
          status: 'failed',
          errorMessage: error.message || 'Unknown error during booking',
          updatedAt: new Date(),
        })
        .where({ id: schedulerRequest.id });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to book appointment',
          details: error.message,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Scheduler API] Request validation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request data',
        details: error.message,
      },
      { status: 400 }
    );
  }
}
