/**
 * Complete Backflow Booking After Payment API
 * 
 * Retrieves Stripe session, creates ServiceTitan job with payment info.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { schedulerRequests, trackingNumbers, insertSchedulerRequestSchema } from '@shared/schema';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const requestSchema = z.object({
  sessionId: z.string(),
});

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const body = await req.json();
    const { sessionId } = requestSchema.parse(body);

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify this is a backflow testing session
    if (session.metadata?.type !== 'backflow_testing') {
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 400 }
      );
    }

    const paymentIntentId = session.payment_intent as string;

    // IDEMPOTENCY CHECK: Check if this payment has already been processed
    const [existingRequest] = await db.select()
      .from(schedulerRequests)
      .where(eq(schedulerRequests.paymentIntentId, paymentIntentId))
      .limit(1);

    if (existingRequest) {
      // If booking failed previously, allow retry by deleting the failed record
      if (existingRequest.status === 'failed') {
        console.log(`[Backflow Booking] Payment ${paymentIntentId} had failed booking, retrying...`);
        await db.delete(schedulerRequests)
          .where(eq(schedulerRequests.id, existingRequest.id));
      } 
      // If booking is confirmed/pending, check if ServiceTitan job was created
      else if (existingRequest.status === 'confirmed' || existingRequest.status === 'pending') {
        // If we already have ServiceTitan job IDs, return immediately
        if (existingRequest.serviceTitanJobId) {
          console.log(`[Backflow Booking] Payment ${paymentIntentId} already has ServiceTitan job ${existingRequest.serviceTitanJobId}`);
          return NextResponse.json({
            success: true,
            requestId: existingRequest.id,
            jobNumber: existingRequest.serviceTitanJobId.toString(),
            jobId: existingRequest.serviceTitanJobId,
            appointmentId: existingRequest.serviceTitanAppointmentId || undefined,
            message: 'Booking already completed',
            alreadyProcessed: true,
          });
        }
        
        // Still processing - wait and re-fetch
        console.log(`[Backflow Booking] Payment ${paymentIntentId} is still processing, waiting for ServiceTitan job...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second wait
        
        // Re-fetch to get updated job info
        const [updated] = await db.select()
          .from(schedulerRequests)
          .where(eq(schedulerRequests.paymentIntentId, paymentIntentId))
          .limit(1);
        
        if (updated && updated.serviceTitanJobId) {
          return NextResponse.json({
            success: true,
            requestId: updated.id,
            jobNumber: updated.serviceTitanJobId.toString(),
            jobId: updated.serviceTitanJobId,
            appointmentId: updated.serviceTitanAppointmentId || undefined,
            message: 'Booking completed',
            alreadyProcessed: true,
          });
        }
        
        // Still no job ID after waiting - return processing status
        return NextResponse.json({
          success: true,
          requestId: updated?.id || existingRequest.id,
          jobNumber: 'Processing',
          message: 'Booking is being processed, please refresh in a moment',
          alreadyProcessed: true,
          processing: true,
        });
      }
    }

    // Parse booking data from metadata
    const bookingData = JSON.parse(session.metadata!.bookingData);
    const deviceCount = parseInt(session.metadata!.deviceCount);
    const customerName = session.metadata!.customerName;
    const customerPhone = session.metadata!.customerPhone;

    // Validate booking data
    const validated = insertSchedulerRequestSchema.parse({
      customerName,
      customerEmail: session.customer_details?.email || bookingData.customerEmail || undefined,
      customerPhone,
      address: bookingData.address,
      city: bookingData.city,
      state: bookingData.state || 'TX',
      zipCode: bookingData.zipCode,
      requestedService: bookingData.requestedService,
      preferredDate: bookingData.preferredDate ? new Date(bookingData.preferredDate) : undefined,
      preferredTimeSlot: bookingData.preferredTimeSlot,
      specialInstructions: bookingData.specialInstructions,
      bookingSource: 'website',
      status: 'pending',
      // Payment info
      paymentIntentId,
      paymentAmount: session.amount_total || 0,
      paymentStatus: 'succeeded',
      isPrepaid: true,
    });

    // Extract utm_source from booking data
    const utmSource = bookingData.utm_source || 'website';

    // Create scheduler request record with unique constraint handling
    let schedulerRequest;
    try {
      [schedulerRequest] = await db.insert(schedulerRequests).values(validated).returning();
    } catch (error: any) {
      // Handle unique constraint violation (concurrent requests)
      if (error.code === '23505' && error.constraint === 'scheduler_requests_payment_intent_id_unique') {
        console.log(`[Backflow Booking] Concurrent insert detected for payment ${paymentIntentId}, fetching existing record`);
        
        // Re-fetch the existing record
        const [existing] = await db.select()
          .from(schedulerRequests)
          .where(eq(schedulerRequests.paymentIntentId, paymentIntentId))
          .limit(1);
        
        if (existing) {
          // Wait briefly for ServiceTitan job to be created if still pending
          if (existing.status === 'pending' && !existing.serviceTitanJobId) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second wait
            
            // Re-fetch to get updated job info
            const [updated] = await db.select()
              .from(schedulerRequests)
              .where(eq(schedulerRequests.paymentIntentId, paymentIntentId))
              .limit(1);
            
            if (updated && updated.serviceTitanJobId) {
              return NextResponse.json({
                success: true,
                requestId: updated.id,
                jobNumber: updated.serviceTitanJobId.toString(),
                jobId: updated.serviceTitanJobId,
                appointmentId: updated.serviceTitanAppointmentId || undefined,
                message: 'Booking already completed',
                alreadyProcessed: true,
              });
            }
          }
          
          // Return existing job info even if still processing
          return NextResponse.json({
            success: true,
            requestId: existing.id,
            jobNumber: existing.serviceTitanJobId?.toString() || 'Processing',
            jobId: existing.serviceTitanJobId || undefined,
            appointmentId: existing.serviceTitanAppointmentId || undefined,
            message: existing.serviceTitanJobId ? 'Booking already completed' : 'Booking is being processed',
            alreadyProcessed: true,
            processing: !existing.serviceTitanJobId,
          });
        }
      }
      
      // Re-throw other errors
      throw error;
    }

    try {
      // Step 1: Resolve campaign from tracking number mapping
      console.log(`[Backflow Booking] Looking up campaign for utm_source: ${utmSource}`);
      
      let campaignId: number | undefined;
      const [trackingNumber] = await db.select()
        .from(trackingNumbers)
        .where(eq(trackingNumbers.channelKey, utmSource))
        .limit(1);
      
      if (trackingNumber?.serviceTitanCampaignId) {
        campaignId = trackingNumber.serviceTitanCampaignId;
        console.log(`[Backflow Booking] Found campaign from tracking number: ${trackingNumber.serviceTitanCampaignName || trackingNumber.channelName} (ID: ${campaignId})`);
      } else {
        console.log(`[Backflow Booking] No tracking number mapping for ${utmSource}, looking for default "website" campaign`);
        const campaigns = await serviceTitanSettings.getCampaigns();
        const websiteCampaign = campaigns.find(c => 
          c.name.toLowerCase() === 'website' || 
          c.source?.toLowerCase() === 'website'
        );
        
        if (websiteCampaign) {
          campaignId = websiteCampaign.id;
          console.log(`[Backflow Booking] Using default website campaign (ID: ${campaignId})`);
        }
      }

      // Step 2: Resolve job type
      console.log(`[Backflow Booking] Looking up job type for: ${validated.requestedService}`);
      const jobType = await serviceTitanSettings.findJobTypeByName(validated.requestedService);
      
      if (!jobType) {
        throw new Error(`Job type not found for service: ${validated.requestedService}`);
      }
      
      console.log(`[Backflow Booking] Found job type: ${jobType.name} (ID: ${jobType.id})`);

      // Step 3: Get business unit
      const businessUnits = await serviceTitanSettings.getBusinessUnits();
      if (businessUnits.length === 0) {
        throw new Error('No active business units found in ServiceTitan');
      }
      
      const businessUnitId = jobType.defaultBusinessUnitId || businessUnits[0].id;
      console.log(`[Backflow Booking] Using business unit ID: ${businessUnitId}`);

      // Step 4: Ensure customer exists in ServiceTitan
      console.log(`[Backflow Booking] Creating/finding customer for ${validated.customerName}`);
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

      // Step 5: Ensure location exists for customer
      console.log(`[Backflow Booking] Creating/finding location for customer ${customer.id}`);
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

      // Step 5b: Add special instructions as pinned note if provided
      if (bookingData.specialInstructions && bookingData.specialInstructions.trim()) {
        console.log(`[Backflow Booking] Adding special instructions as pinned note to location ${location.id}`);
        await serviceTitanCRM.createLocationNote(
          location.id,
          `Special Instructions: ${bookingData.specialInstructions.trim()}`,
          true
        );
      }

      // Step 6: Create job with payment info
      const paymentAmount = session.amount_total! / 100; // Convert cents to dollars
      const specialInstructions = `${validated.specialInstructions || ''}\n\nPREPAID via Stripe: $${paymentAmount.toFixed(2)} for ${deviceCount} device${deviceCount > 1 ? 's' : ''}\nStripe Payment ID: ${session.payment_intent}\nStripe Session ID: ${session.id}`.trim();

      console.log(`[Backflow Booking] Creating job with payment info`);
      const job = await serviceTitanJobs.createJob({
        customerId: customer.id,
        locationId: location.id,
        businessUnitId,
        jobTypeId: jobType.id,
        summary: `${validated.requestedService} - ${deviceCount} device${deviceCount > 1 ? 's' : ''} - PREPAID`,
        preferredDate: validated.preferredDate || undefined,
        preferredTimeSlot: validated.preferredTimeSlot as any,
        specialInstructions,
        campaignId: campaignId || undefined,
      });

      // Update scheduler request with ServiceTitan IDs and payment info
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
        .where(eq(schedulerRequests.id, schedulerRequest.id));

      console.log(`[Backflow Booking] Successfully booked prepaid job ${job.jobNumber}`);

      return NextResponse.json({
        success: true,
        requestId: schedulerRequest.id,
        jobNumber: job.jobNumber,
        jobId: job.id,
        appointmentId: job.firstAppointmentId,
        message: `Backflow testing appointment successfully scheduled and paid! Job #${job.jobNumber}`,
      });

    } catch (error: any) {
      console.error('[Backflow Booking] Failed:', error);

      // Update scheduler request with error
      await db.update(schedulerRequests)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(schedulerRequests.id, schedulerRequest.id));

      return NextResponse.json(
        { error: error.message || 'Failed to create job in ServiceTitan' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Backflow Booking] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete booking' },
      { status: 500 }
    );
  }
}
