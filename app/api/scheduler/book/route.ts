/**
 * Scheduler Booking API
 * 
 * Handles appointment booking requests and creates jobs in ServiceTitan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { schedulerRequests, trackingNumbers, insertSchedulerRequestSchema, pendingReferrals, referrals, referralCodes } from '@shared/schema';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { validateSchedulerSession } from '@/server/lib/schedulerSession';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    // Optional: Check for authenticated session (for audit trail)
    let authenticatedCustomerId: number | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = validateSchedulerSession(token);
      if (session && session.customerId) {
        authenticatedCustomerId = session.customerId;
        console.log(`[Scheduler] Authenticated booking for customer ${authenticatedCustomerId}`);
      }
    }

    const body = await req.json();

    // Validate request data
    const validated = insertSchedulerRequestSchema.parse({
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      address: body.address,
      city: body.city,
      state: body.state,
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
      // Step 1: Resolve campaign from tracking number mapping or fallback to "website" (REQUIRED)
      console.log(`[Scheduler] Looking up campaign for utm_source: ${utmSource}`);
      
      // First, check if we have a tracking number with ServiceTitan campaign mapping
      let campaignId: number;
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
          // REQUIRED: campaignId is mandatory, throw error if not found
          throw new Error('No ServiceTitan campaign found. Please create a "Website" campaign in ServiceTitan Marketing > Campaigns.');
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

      // Step 4 & 5: Get customer and location IDs
      // If we already have them from the lookup, skip creation
      let customerId: number;
      let locationId: number;
      
      if (body.serviceTitanId && body.locationId) {
        // Use existing customer and location from lookup
        customerId = body.serviceTitanId;
        locationId = body.locationId;
        console.log(`[Scheduler] Using existing customer ${customerId} and location ${locationId}`);
      } else {
        // Validate complete address is provided (NO DEFAULTS ALLOWED)
        if (!validated.city || !validated.state || !validated.zipCode) {
          throw new Error('Complete address required. Please provide city, state, and ZIP code.');
        }
        
        // Ensure customer exists in ServiceTitan
        console.log(`[Scheduler] Creating/finding customer for ${validated.customerName}`);
        const customer = await serviceTitanCRM.ensureCustomer({
          name: validated.customerName,
          phone: validated.customerPhone,
          email: validated.customerEmail || undefined,
          address: {
            street: validated.address,
            city: validated.city,
            state: validated.state,
            zip: validated.zipCode,
          },
        });
        customerId = customer.id;

        // Ensure location exists for customer
        console.log(`[Scheduler] Creating/finding location for customer ${customerId}`);
        const location = await serviceTitanCRM.ensureLocation(customerId, {
          customerId,
          address: {
            street: validated.address,
            city: validated.city,
            state: validated.state,
            zip: validated.zipCode,
          },
          phone: validated.customerPhone,
          email: validated.customerEmail || undefined,
        });
        locationId = location.id;
      }

      // Step 6: Determine technician assignment
      // Priority: 1) Pre-selected from smart slot, 2) From body, 3) Fallback to available technician
      let technicianId: number | undefined = body.slot?.technicianId || body.technicianId || undefined;
      
      if (technicianId) {
        console.log(`[Scheduler] Using pre-selected technician from smart slot: ${technicianId}`);
      } else {
        // Fallback: Get available technician for assignment (optional)
        console.log(`[Scheduler] No pre-selected technician, finding available technician...`);
        
        try {
          const technicians = await serviceTitanSettings.getTechnicians();
          // Filter for actual technicians (not all employees)
          const activeTechs = technicians.filter(t => 
            t.active && 
            (t.role?.toLowerCase().includes('technician') || t.isTechnician)
          );
          
          if (activeTechs.length > 0) {
            const availableTech = activeTechs[0];
            technicianId = availableTech.id;
            console.log(`[Scheduler] Assigned fallback technician: ${availableTech.name} (ID: ${availableTech.id})`);
          } else {
            console.log(`[Scheduler] No technicians available - job will be created unassigned`);
          }
        } catch (error) {
          console.log(`[Scheduler] Could not fetch technicians - job will be created unassigned`);
        }
      }

      // Step 7: Create job with real IDs and campaign (REQUIRED)
      console.log(`[Scheduler] Creating job for ${validated.requestedService} (JobType: ${jobType.id}, BU: ${businessUnitId}, Campaign: ${campaignId})`);
      
      // Extract arrival window (customer promise) and appointment slot (actual schedule)
      const arrivalWindowStart = body.arrivalWindowStart || undefined;
      const arrivalWindowEnd = body.arrivalWindowEnd || undefined;
      const appointmentStart = body.appointmentStart || undefined;
      const appointmentEnd = body.appointmentEnd || undefined;
      
      // Validate appointment times if provided
      if (appointmentStart && appointmentEnd && arrivalWindowStart && arrivalWindowEnd) {
        const aptStart = new Date(appointmentStart);
        const aptEnd = new Date(appointmentEnd);
        const windowStart = new Date(arrivalWindowStart);
        const windowEnd = new Date(arrivalWindowEnd);
        
        // Ensure appointment slot is within arrival window
        if (aptStart < windowStart || aptEnd > windowEnd) {
          throw new Error('Appointment slot must be within the selected arrival window');
        }
        
        console.log(`[Scheduler] Validated appointment slot ${appointmentStart} - ${appointmentEnd} within window ${arrivalWindowStart} - ${arrivalWindowEnd}`);
      } else if ((appointmentStart && !appointmentEnd) || (!appointmentStart && appointmentEnd)) {
        throw new Error('Both appointmentStart and appointmentEnd must be provided together');
      }
      
      console.log(`[Scheduler] Booking with arrival window: ${arrivalWindowStart} - ${arrivalWindowEnd}`);
      if (appointmentStart && appointmentEnd) {
        console.log(`[Scheduler] Appointment slot: ${appointmentStart} - ${appointmentEnd}`);
      }
      
      // Build combined special instructions from customer input, Groupon voucher, and any existing instructions
      const instructionsParts: string[] = [];
      
      if (body.specialInstructions && body.specialInstructions.trim()) {
        instructionsParts.push(body.specialInstructions.trim());
      }
      
      if (body.grouponVoucher && body.grouponVoucher.trim()) {
        instructionsParts.push(`Groupon Voucher: ${body.grouponVoucher.trim()}`);
      }
      
      if (validated.specialInstructions && validated.specialInstructions.trim()) {
        instructionsParts.push(validated.specialInstructions.trim());
      }
      
      const combinedInstructions = instructionsParts.length > 0 
        ? instructionsParts.join('\n\n') 
        : undefined;
      
      if (combinedInstructions) {
        console.log(`[Scheduler] Adding special instructions to appointment:\n${combinedInstructions}`);
      }
      
      // Build summary with problemDescription if available
      const summary = body.problemDescription && body.problemDescription.trim()
        ? `${validated.requestedService} - ${body.problemDescription.trim()}`
        : `${validated.requestedService} - Booked via website`;
      
      const job = await serviceTitanJobs.createJob({
        customerId,
        locationId,
        businessUnitId,
        jobTypeId: jobType.id,
        summary,
        preferredDate: validated.preferredDate || undefined,
        preferredTimeSlot: validated.preferredTimeSlot as any,
        arrivalWindowStart,
        arrivalWindowEnd,
        appointmentStart, // Actual scheduled slot within arrival window
        appointmentEnd, // Actual scheduled slot end
        specialInstructions: combinedInstructions,
        campaignId, // REQUIRED field
        technicianId, // Assign technician if available
      });

      // Update scheduler request with ServiceTitan IDs
      await db.update(schedulerRequests)
        .set({
          serviceTitanCustomerId: customerId,
          serviceTitanLocationId: locationId,
          serviceTitanJobId: job.id,
          serviceTitanAppointmentId: job.firstAppointmentId,
          status: 'confirmed',
          bookedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schedulerRequests.id, schedulerRequest.id));

      console.log(`[Scheduler] Successfully booked job ${job.jobNumber}`);

      // Track referral conversion if referralToken was provided
      if (body.referralToken) {
        try {
          const [pendingReferral] = await db
            .select()
            .from(pendingReferrals)
            .where(eq(pendingReferrals.trackingCookie, body.referralToken))
            .limit(1);

          if (pendingReferral && !pendingReferral.convertedAt) {
            // Look up referrer's phone from referralCodes table
            const [referrerCode] = await db
              .select()
              .from(referralCodes)
              .where(eq(referralCodes.customerId, pendingReferral.referrerCustomerId))
              .limit(1);

            if (!referrerCode?.customerPhone) {
              console.warn(`[Scheduler] Skipping referral conversion for ${pendingReferral.id}: referrer phone not found for customer ${pendingReferral.referrerCustomerId}`);
              // Skip referral tracking but continue with normal booking flow
            } else {

            // Use verified phone from scheduler (just collected from customer)
            // This is more reliable than the landing page phone which might be missing
            const refereePhone = validated.customerPhone;

            // Check if referral already exists (prevent duplicates)
            let referral;
            if (pendingReferral.referralId) {
              // Already linked to a referral - update it
              const [existing] = await db
                .select()
                .from(referrals)
                .where(eq(referrals.id, pendingReferral.referralId))
                .limit(1);
              
              if (existing) {
                console.log(`[Scheduler] Updating existing referral ${existing.id}`);
                [referral] = await db
                  .update(referrals)
                  .set({
                    refereePhone, // Update with verified phone
                    refereeCustomerId: customerId,
                    status: 'contacted',
                    firstJobId: job.id.toString(),
                    firstJobDate: new Date(),
                  })
                  .where(eq(referrals.id, existing.id))
                  .returning();
              } else {
                console.warn(`[Scheduler] Referral ID ${pendingReferral.referralId} not found, creating new one`);
              }
            }
            
            // Create new referral if none exists
            if (!referral) {
              [referral] = await db
                .insert(referrals)
                .values({
                  referrerName: pendingReferral.referrerName,
                  referrerPhone: referrerCode.customerPhone,
                  referrerCustomerId: pendingReferral.referrerCustomerId,
                  refereeName: pendingReferral.refereeName,
                  refereePhone, // Use verified phone from scheduler
                  refereeEmail: pendingReferral.refereeEmail || validated.customerEmail || undefined,
                  refereeCustomerId: customerId,
                  status: 'contacted',
                  firstJobId: job.id.toString(),
                  firstJobDate: new Date(),
                })
                .returning();
            }

            // Update pending referral to mark as converted and link to referral
            await db
              .update(pendingReferrals)
              .set({
                convertedAt: new Date(),
                convertedToReferral: true,
                referralId: referral.id,
              })
              .where(eq(pendingReferrals.id, pendingReferral.id));

            console.log(`[Scheduler] Converted pending referral ${pendingReferral.id} to referral ${referral.id} for customer ${customerId}`);
            }
          } else if (pendingReferral) {
            console.log(`[Scheduler] Referral ${pendingReferral.id} already converted`);
          } else {
            console.log(`[Scheduler] No pending referral found for token ${body.referralToken}`);
          }
        } catch (error: any) {
          console.error('[Scheduler] Error tracking referral conversion:', error);
          // Don't fail the booking if referral tracking fails
        }
      }

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
