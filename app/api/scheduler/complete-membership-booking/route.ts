import { db } from '@/server/db';
import { schedulerRequests } from '@shared/schema';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createMembershipSale } from '@/server/lib/membershipSales';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const requestSchema = z.object({
  sessionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    const { sessionId } = result.data;

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
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
        console.log(`[Membership Booking] Payment ${paymentIntentId} had failed booking, retrying...`);
        await db.delete(schedulerRequests)
          .where(eq(schedulerRequests.id, existingRequest.id));
      } 
      // If booking is confirmed/pending, check if ServiceTitan job was created
      else if (existingRequest.status === 'confirmed' || existingRequest.status === 'pending') {
        // If we already have ServiceTitan job IDs, return immediately
        if (existingRequest.serviceTitanJobId) {
          console.log(`[Membership Booking] Payment ${paymentIntentId} already has ServiceTitan job ${existingRequest.serviceTitanJobId}`);
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
        console.log(`[Membership Booking] Payment ${paymentIntentId} is still processing, waiting for ServiceTitan job...`);
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

    // Parse booking data and ServiceTitan IDs from metadata
    const bookingData = JSON.parse(session.metadata!.bookingData);
    const membershipId = session.metadata!.membershipId;
    const membershipName = session.metadata!.membershipName;
    const saleTaskId = parseInt(session.metadata!.saleTaskId || '0');
    const durationBillingId = parseInt(session.metadata!.durationBillingId || '0');
    const referralCode = session.metadata!.referralCode || '';
    const referralDiscount = parseFloat(session.metadata!.referralDiscount || '0');
    
    // Validate ServiceTitan IDs
    if (!saleTaskId || !durationBillingId) {
      throw new Error(
        'Missing ServiceTitan IDs in Stripe metadata. ' +
        'Please ensure the product has saleTaskId (SKU) and durationBillingId configured.'
      );
    }

    // Create validated request object
    const validated = {
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      address: bookingData.location.address,
      city: bookingData.location.city,
      state: bookingData.location.state,
      zipCode: bookingData.location.zip,
      requestedService: bookingData.service.name,
      preferredDate: bookingData.preferredDate ? new Date(bookingData.preferredDate) : undefined,
      preferredTimeSlot: bookingData.preferredTimeSlot,
      specialInstructions: bookingData.specialInstructions,
      bookingSource: 'website',
      status: 'pending' as const,
      // Payment info
      paymentIntentId,
      paymentAmount: session.amount_total ? session.amount_total.toString() : '0', // Convert to string for numeric column
      paymentStatus: 'succeeded' as const,
      isPrepaid: true,
    };

    // Extract utm_source from booking data
    const utmSource = bookingData.utm_source || 'website';

    // Create scheduler request record with unique constraint handling
    let schedulerRequest;
    try {
      [schedulerRequest] = await db.insert(schedulerRequests).values([validated]).returning();
    } catch (error: any) {
      // Handle unique constraint violation (concurrent requests)
      if (error.code === '23505' && error.constraint === 'scheduler_requests_payment_intent_id_unique') {
        console.log(`[Membership Booking] Concurrent insert detected for payment ${paymentIntentId}, fetching existing record`);
        
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
      // Use modular membership sale helper - replaces Zapier flow
      console.log(`[Membership Booking] Creating membership sale for ${validated.customerName}`);
      
      const paymentAmount = session.amount_total!; // in cents
      const result = await createMembershipSale({
        // Customer info
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        customerEmail: validated.customerEmail || undefined,
        
        // Location
        address: {
          street: validated.address,
          city: validated.city || 'Austin',
          state: validated.state || 'TX',
          zip: validated.zipCode || '78701',
        },
        
        // ServiceTitan IDs from Stripe metadata
        saleTaskId,
        durationBillingId,
        
        // Campaign resolution
        utmSource,
        
        // Payment context for logging
        paymentIntentId,
        paymentAmount,
        referralCode: referralCode || undefined,
      });
      
      // SECURITY: Handle membership sale failure properly
      if (!result.success) {
        // Mark scheduler request as failed with clear error
        await db.update(schedulerRequests)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(schedulerRequests.id, schedulerRequest.id));
        
        throw new Error(result.error || 'Membership sale failed');
      }

      // Update scheduler request with ServiceTitan IDs
      await db.update(schedulerRequests)
        .set({
          serviceTitanCustomerId: result.customerId,
          serviceTitanLocationId: result.locationId,
          serviceTitanJobId: result.invoiceId, // Store invoice ID in jobId field
          status: 'confirmed',
          bookedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schedulerRequests.id, schedulerRequest.id));

      console.log(`[Membership Booking] Success - Invoice: ${result.invoiceId}, Membership: ${result.customerMembershipId}`);

      return NextResponse.json({
        success: true,
        requestId: schedulerRequest.id,
        invoiceId: result.invoiceId,
        customerMembershipId: result.customerMembershipId,
        message: `VIP Membership successfully purchased! Invoice #${result.invoiceId}`,
      });
    } catch (error: any) {
      console.error('[Membership Booking] Failed:', error);

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
    console.error('[Membership Booking] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete booking' },
      { status: 500 }
    );
  }
}
