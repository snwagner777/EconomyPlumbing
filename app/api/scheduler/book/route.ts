/**
 * Scheduler Booking API
 * 
 * Handles appointment booking requests and creates jobs in ServiceTitan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { schedulerRequests, trackingNumbers, insertSchedulerRequestSchema } from '@shared/schema';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { eq } from 'drizzle-orm';

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

    // Extract utm_source from request headers or body
    const utmSource = body.utm_source || new URL(req.url).searchParams.get('utm_source') || 'website';

    // Create scheduler request record
    const [schedulerRequest] = await db.insert(schedulerRequests).values(validated).returning();

    try {
      // Step 1: Resolve campaign from tracking number mapping or fallback to "website"
      console.log(`[Scheduler] Looking up campaign for utm_source: ${utmSource}`);
      
      // First, check if we have a tracking number with ServiceTitan campaign mapping
      let campaignId: number | undefined;
      const [trackingNumber] = await db.select()
        .from(trackingNumbers)
        .where(eq(trackingNumbers.channelKey, utmSource))
        .limit(1);
      
      if (trackingNumber?.serviceTitanCampaignId) {
        campaignId = trackingNumber.serviceTitanCampaignId;
        console.log(`[Scheduler] Found campaign from tracking number: ${trackingNumber.serviceTitanCampaignName || trackingNumber.channelName} (ID: ${campaignId})`);
      } else {
        // Fallback: Try to find "website" or "Website" campaign
        console.log(`[Scheduler] No tracking number mapping for ${utmSource}, looking for default "website" campaign`);
        const campaigns = await serviceTitanSettings.getCampaigns();
        const websiteCampaign = campaigns.find(c => 
          c.name.toLowerCase() === 'website' || 
          c.source?.toLowerCase() === 'website'
        );
        
        if (websiteCampaign) {
          campaignId = websiteCampaign.id;
          console.log(`[Scheduler] Using default website campaign (ID: ${campaignId})`);
        } else {
          console.log(`[Scheduler] No default campaign found, proceeding without campaign tracking`);
        }
      }

      // Step 2: Resolve job type from service name
      console.log(`[Scheduler] Looking up job type for: ${validated.requestedService}`);
      const jobType = await serviceTitanSettings.findJobTypeByName(validated.requestedService);
      
      if (!jobType) {
        throw new Error(`Job type not found for service: ${validated.requestedService}. Please configure job types in ServiceTitan.`);
      }
      
      console.log(`[Scheduler] Found job type: ${jobType.name} (ID: ${jobType.id})`);

      // Step 3: Get business unit (use first active one for now)
      const businessUnits = await serviceTitanSettings.getBusinessUnits();
      if (businessUnits.length === 0) {
        throw new Error('No active business units found in ServiceTitan');
      }
      
      // Use job type's default business unit if specified, otherwise first available
      const businessUnitId = jobType.defaultBusinessUnitId || businessUnits[0].id;
      console.log(`[Scheduler] Using business unit ID: ${businessUnitId}`);

      // Step 4: Ensure customer exists in ServiceTitan
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

      // Step 5: Ensure location exists for customer
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

      // Step 5b: Add gate code as pinned note if provided
      if (body.gateCode && body.gateCode.trim()) {
        console.log(`[Scheduler] Adding gate code as pinned note to location ${location.id}`);
        await serviceTitanCRM.createLocationNote(
          location.id,
          `Gate Code: ${body.gateCode.trim()}`,
          true
        );
      }

      // Step 6: Create job with real IDs and campaign
      console.log(`[Scheduler] Creating job for ${validated.requestedService} (JobType: ${jobType.id}, BU: ${businessUnitId}${campaignId ? `, Campaign: ${campaignId}` : ''})`);
      
      // Use actual arrival window times if provided, otherwise fall back to preferredDate/TimeSlot
      const arrivalWindowStart = body.arrivalWindowStart || undefined;
      const arrivalWindowEnd = body.arrivalWindowEnd || undefined;
      
      const job = await serviceTitanJobs.createJob({
        customerId: customer.id,
        locationId: location.id,
        businessUnitId,
        jobTypeId: jobType.id,
        summary: `${validated.requestedService} - Booked via website`,
        preferredDate: validated.preferredDate || undefined,
        preferredTimeSlot: validated.preferredTimeSlot as any,
        arrivalWindowStart,
        arrivalWindowEnd,
        specialInstructions: validated.specialInstructions || undefined,
        campaignId: campaignId || undefined,
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
        .where(eq(schedulerRequests.id, schedulerRequest.id));

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
        .where(eq(schedulerRequests.id, schedulerRequest.id));

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
