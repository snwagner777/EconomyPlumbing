/**
 * Smart Scheduler Availability API
 * 
 * Intelligently suggests appointment slots based on:
 * - ServiceTitan Capacity API (actual available time slots)
 * - Customer location (address/zip) for proximity scoring
 * - Existing jobs scheduled for that day
 * - Proximity scoring to minimize driving distance
 * - Zone clustering for fuel efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { db } from '@/server/db';
import { serviceTitanZones } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { format, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

interface SmartAvailabilityRequest {
  jobTypeId: number;
  businessUnitId?: number;
  customerZip?: string;
  customerAddress?: string;
  startDate: string;
  endDate?: string;
}

interface ScoredSlot {
  id: string;
  start: string; // 2-hour appointment booking time start
  end: string; // 2-hour appointment booking time end
  arrivalWindowStart: string; // 4-hour customer promise window start
  arrivalWindowEnd: string; // 4-hour customer promise window end
  date: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  proximityScore: number; // 0-100, higher = more fuel efficient
  nearbyJobs: number; // Count of jobs in same zone during this window
  zone?: string; // ZIP prefix or area code
  technicianId?: number | null; // Pre-assigned technician for optimal routing
  availableCapacity?: number; // From ServiceTitan Capacity API
  totalCapacity?: number; // From ServiceTitan Capacity API
}

interface Appointment {
  id: number;
  start: string;
  end: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
}

// Business hours: 8 AM - 5 PM, Monday - Friday
const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17;

export async function POST(req: NextRequest) {
  try {
    const body: SmartAvailabilityRequest = await req.json();
    const { jobTypeId, businessUnitId, customerZip, customerAddress, startDate, endDate } = body;
    
    if (!jobTypeId || !startDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: jobTypeId and startDate',
        },
        { status: 400 }
      );
    }
    
    // CRITICAL: Parse dates as Central Time midnight to avoid timezone bugs
    // If frontend sends "2025-11-08", we want Nov 8 at 00:00 Central Time, not UTC
    const TIMEZONE = 'America/Chicago';
    const start = fromZonedTime(`${startDate}T00:00:00`, TIMEZONE);
    const end = endDate 
      ? fromZonedTime(`${endDate}T00:00:00`, TIMEZONE)
      : addDays(start, 10);
    
    console.log(`[Smart Scheduler] Fetching availability from ${formatInTimeZone(start, TIMEZONE, 'yyyy-MM-dd HH:mm zzz')} to ${formatInTimeZone(end, TIMEZONE, 'yyyy-MM-dd HH:mm zzz')}`);
    
    // Get job type details to check if it's backflow testing
    const jobTypes = await serviceTitanSettings.getJobTypes();
    const jobType = jobTypes.find(jt => jt.id === jobTypeId);
    const isBackflowJob = jobType?.name?.toLowerCase().includes('backflow') || false;
    
    console.log(`[Smart Scheduler] Job Type: ${jobType?.name} (ID: ${jobTypeId}), Is Backflow: ${isBackflowJob}`);
    
    // Get business unit (use provided or default to plumbing)
    let actualBusinessUnitId = businessUnitId;
    if (!actualBusinessUnitId) {
      const businessUnits = await serviceTitanSettings.getBusinessUnits();
      const plumbingBU = businessUnits.find(bu => bu.name.toLowerCase().includes('plumbing'));
      actualBusinessUnitId = plumbingBU?.id;
      
      if (!actualBusinessUnitId) {
        return NextResponse.json(
          {
            success: false,
            error: 'No business unit found',
          },
          { status: 500 }
        );
      }
    }
    
    // BACKFLOW JOBS: Different arrival window strategy
    // - Backflow testing shows ONLY 8am-8pm arrival window (single all-day slot)
    // - Regular jobs use 4-hour windows (8-12, 12-4, 4-8) with 2-hour bookings inside
    
    // Define blocks to check based on job type
    const twoHourBlocks = isBackflowJob
      ? [
          // Backflow: Check full 12-hour window as a single slot
          { start: 8, end: 20, label: '8am-8pm (Backflow All-Day)' },
        ]
      : [
          // Regular services: Check 2-hour blocks for standard 4-hour windows
          { start: 8, end: 10, label: '8-10am' },
          { start: 10, end: 12, label: '10am-12pm' },
          { start: 12, end: 14, label: '12-2pm' },
          { start: 14, end: 16, label: '2-4pm' },
          { start: 16, end: 18, label: '4-6pm' },
        ];
    
    console.log(`[Smart Scheduler] ${isBackflowJob ? 'Backflow mode - checking all-day availability' : `Checking ${twoHourBlocks.length} 2-hour blocks per day`}`);
    
    // Collect all available 2-hour slots across all days
    const allAvailable2HourSlots: any[] = [];
    
    // Iterate through each day in the date range
    let currentDay = new Date(start);
    const endDay = new Date(end);
    
    while (currentDay <= endDay) {
      const dayStr = formatInTimeZone(currentDay, TIMEZONE, 'yyyy-MM-dd');
      console.log(`[Smart Scheduler] Checking ${dayStr}...`);
      
      // Check each 2-hour block for this day
      for (const block of twoHourBlocks) {
        // Create start/end times for this 2-hour block in Central Time
        const blockStart = fromZonedTime(`${dayStr}T${String(block.start).padStart(2, '0')}:00:00`, TIMEZONE);
        const blockEnd = fromZonedTime(`${dayStr}T${String(block.end).padStart(2, '0')}:00:00`, TIMEZONE);
        
        // Call ServiceTitan Capacity API for this specific 2-hour block
        const capacityResponse = await serviceTitanSettings.checkCapacity({
          businessUnitId: actualBusinessUnitId,
          jobTypeId,
          startDate: blockStart,
          endDate: blockEnd,
          skillBasedAvailability: true,
        });
        
        // Filter to truly available slots (both isAvailable=true AND capacity>0)
        const availableSlots = capacityResponse.filter(slot => 
          slot.isAvailable && (slot.availableCapacity || 0) > 0
        );
        
        if (availableSlots.length > 0) {
          console.log(`[Smart Scheduler] ✅ ${dayStr} ${block.label}: ${availableSlots.length} available slot(s)`);
          // DEBUG: Log what Capacity API actually returned vs what we requested
          if (availableSlots[0]) {
            console.log(`[Smart Scheduler] DEBUG Requested: ${blockStart.toISOString()} to ${blockEnd.toISOString()}`);
            console.log(`[Smart Scheduler] DEBUG Capacity API returned: ${availableSlots[0].start} to ${availableSlots[0].end}`);
          }
          allAvailable2HourSlots.push(...availableSlots.map(slot => ({
            ...slot,
            blockLabel: block.label,
            blockStart: block.start,
            blockEnd: block.end,
            dayStr,
          })));
        } else {
          console.log(`[Smart Scheduler] ❌ ${dayStr} ${block.label}: No availability`);
        }
      }
      
      // Move to next day
      currentDay = addDays(currentDay, 1);
    }
    
    console.log(`[Smart Scheduler] Total available 2-hour slots found: ${allAvailable2HourSlots.length}`);
    
    // Use the collected 2-hour slots for scoring (same variable name as before)
    const truelyAvailableSlots = allAvailable2HourSlots;
    
    // Fetch scheduled jobs for proximity scoring (next 10 days)
    const existingJobs = await serviceTitanJobs.getJobsForDateRange(start, end);
    console.log(`[Smart Scheduler] Found ${existingJobs.length} jobs for proximity scoring`);
    
    // Fetch technician assignments for all jobs
    const appointmentIds = existingJobs.map(j => j.appointmentId);
    const techAssignments = await serviceTitanJobs.getTechnicianAssignments(
      appointmentIds,
      start,
      end
    );
    
    // Add technician IDs to jobs
    existingJobs.forEach(job => {
      job.technicianId = techAssignments.get(job.appointmentId);
    });
    
    // Extract SERVICE LOCATION zone from serviceTitanZones table
    // NOTE: customerZip should be the service location ZIP, not billing address
    const serviceLocationZone = customerZip ? await getZoneForZip(customerZip) : null;
    const serviceLocationZoneNumber = serviceLocationZone ? parseZoneNumber(serviceLocationZone) : null;
    console.log(`[Smart Scheduler] Service location ZIP: ${customerZip}, Zone: ${serviceLocationZone} (zone #${serviceLocationZoneNumber || 'unknown'})`);
    
    // Precompute zones for all job ZIPs (batch lookup for performance)
    // Normalize to 5 digits to handle ZIP+4 format (e.g., "78701-1234" → "78701")
    const normalizeZip = (zip: string | null | undefined): string | null => {
      if (!zip) return null;
      const digits = zip.replace(/\D/g, '').substring(0, 5);
      return digits.length === 5 ? digits : null; // Only return if valid 5-digit ZIP
    };
    
    const uniqueZips = [...new Set(
      existingJobs
        .map(j => normalizeZip(j.locationZip))
        .filter((zip): zip is string => zip !== null)
    )];
    const zipToZone: Record<string, string> = {};
    
    if (uniqueZips.length > 0) {
      const zones = await db.query.serviceTitanZones.findMany({
        where: (zones) => sql`${zones.zipCodes} && ARRAY[${sql.join(uniqueZips.map(z => sql`${z}`), sql`, `)}]::text[]`,
      });
      
      // Build ZIP to zone mapping (all ZIPs normalized to 5 digits)
      for (const zone of zones) {
        for (const zip of zone.zipCodes) {
          const normalized = normalizeZip(zip);
          if (normalized && uniqueZips.includes(normalized)) {
            zipToZone[normalized] = zone.name;
          }
        }
      }
      
      console.log(`[Smart Scheduler] Mapped ${Object.keys(zipToZone).length} ZIPs to zones`);
    }
    
    // Score each slot based on technician route contiguity and zone adjacency
    const scoredSlots = truelyAvailableSlots.map((slot, index): ScoredSlot | null => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      const slotDate = format(slotStart, 'yyyy-MM-dd');
      
      // Find all jobs scheduled on the same day (not just time overlap!)
      const sameDayJobs = existingJobs.filter(job => {
        const jobDate = format(new Date(job.appointmentStart), 'yyyy-MM-dd');
        return jobDate === slotDate;
      });
      
      // HILL COUNTRY RESTRICTION:
      // Block specific afternoon windows (10-2, 1-5, 2-6) unless there's already a Hill Country job that day
      // This prevents single afternoon trips to Hill Country (fuel efficiency)
      if (serviceLocationZone && serviceLocationZone.toLowerCase().includes('hill country')) {
        const startHourCT = parseInt(slotStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: 'America/Chicago',
        }));
        
        const endHourCT = parseInt(slotEnd.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: 'America/Chicago',
        }));
        
        // Check if this is one of the blocked windows: 10-2, 11-3, 12-4, 1-5, or 2-6
        const isBlockedWindow = 
          (startHourCT === 10 && endHourCT === 14) || // 10 AM - 2 PM
          (startHourCT === 11 && endHourCT === 15) || // 11 AM - 3 PM
          (startHourCT === 12 && endHourCT === 16) || // 12 PM - 4 PM
          (startHourCT === 13 && endHourCT === 17) || // 1 PM - 5 PM
          (startHourCT === 14 && endHourCT === 18);   // 2 PM - 6 PM
        // Note: 8-12 and 9-1 are allowed for Hill Country
        
        if (isBlockedWindow) {
          // Count existing Hill Country jobs on the same day
          const nearbyHillCountryJobs = sameDayJobs.filter(job => {
            const jobZip = normalizeZip(job.locationZip);
            const jobZoneName = jobZip ? zipToZone[jobZip] : null;
            return jobZoneName && jobZoneName.toLowerCase().includes('hill country');
          });
          
          // Block this window if no other Hill Country jobs that day
          if (nearbyHillCountryJobs.length === 0) {
            console.log(`[Hill Country Filter] Blocking ${formatTimeWindow(slot.start, slot.end)} - no Hill Country jobs scheduled that day`);
            return null;
          } else {
            console.log(`[Hill Country Filter] Allowing ${formatTimeWindow(slot.start, slot.end)} - ${nearbyHillCountryJobs.length} Hill Country jobs found that day`);
          }
        }
      }
      
      // Calculate proximity score and best technician for this slot
      const proximityResult = calculateProximityScoreV2(
        slotStart,
        slotEnd,
        serviceLocationZoneNumber,
        sameDayJobs,
        zipToZone,
        normalizeZip,
        parseZoneNumber
      );
      
      // Count jobs in same/adjacent zones for display
      const nearbyJobCount = sameDayJobs.filter(job => {
        const jobZip = normalizeZip(job.locationZip);
        const jobZoneName = jobZip ? zipToZone[jobZip] : null;
        const jobZoneNum = parseZoneNumber(jobZoneName);
        
        if (!serviceLocationZoneNumber || !jobZoneNum) return false;
        const distance = Math.abs(serviceLocationZoneNumber - jobZoneNum);
        return distance <= 1; // Same zone or adjacent
      }).length;

      // Get arrival window for customer display
      // Backflow: 8am-8pm all-day window
      // Regular: 4-hour windows (8-12, 12-4, 4-8)
      const arrivalWindow = get4HourArrivalWindow(slot.start, slot.end, isBackflowJob);
      
      // CRITICAL FIX: ServiceTitan Capacity API returns the FULL arrival window (e.g., 8am-12pm),
      // NOT the specific 2-hour block we requested (e.g., 8-10am).
      // We must use our requested block times for the appointment slot, not what ST returns.
      const dayStr = slot.dayStr;
      const blockStartHour = slot.blockStart;
      const blockEndHour = slot.blockEnd;
      const requestedBlockStart = fromZonedTime(`${dayStr}T${String(blockStartHour).padStart(2, '0')}:00:00`, TIMEZONE);
      const requestedBlockEnd = fromZonedTime(`${dayStr}T${String(blockEndHour).padStart(2, '0')}:00:00`, TIMEZONE);
      
      return {
        id: `slot-${index}`,
        start: requestedBlockStart.toISOString(), // Use OUR requested 2-hour block start
        end: requestedBlockEnd.toISOString(), // Use OUR requested 2-hour block end
        arrivalWindowStart: arrivalWindow.windowStart, // Customer promise window start (4-hour)
        arrivalWindowEnd: arrivalWindow.windowEnd, // Customer promise window end (4-hour)
        date: requestedBlockStart.toISOString().split('T')[0],
        timeLabel: arrivalWindow.windowLabel, // Arrival window label for customer display
        period: getTimePeriod(requestedBlockStart.toISOString()),
        proximityScore: proximityResult.score,
        nearbyJobs: nearbyJobCount,
        zone: serviceLocationZone || undefined,
        technicianId: proximityResult.technicianId, // Pre-assigned technician for optimal routing
      };
    }).filter((slot): slot is ScoredSlot => slot !== null); // Remove filtered-out Hill Country afternoon slots
    
    // Sort by proximity score (highest first), with slight preference for earlier times on ties
    scoredSlots.sort((a, b) => {
      const scoreDiff = b.proximityScore - a.proximityScore;
      // Only use time as tie-breaker for exact score matches
      if (scoreDiff === 0) {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      }
      return scoreDiff;
    });
    
    // Log top 10 slots with scores for debugging
    console.log(`[Smart Scheduler] Top 10 slots by score:`);
    scoredSlots.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.timeLabel} - Score: ${s.proximityScore}`);
    });
    
    return NextResponse.json({
      success: true,
      slots: scoredSlots,
      optimization: {
        customerZone: serviceLocationZone,
        totalSlots: scoredSlots.length,
        optimizedSlots: scoredSlots.filter(s => s.proximityScore > 50).length,
      },
    });
  } catch (error: any) {
    console.error('[Smart Availability API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch smart availability',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


/**
 * Get zone name for a ZIP code from serviceTitanZones table
 */
async function getZoneForZip(zip: string): Promise<string | null> {
  try {
    const cleanedZip = zip.replace(/\D/g, '').substring(0, 5);
    
    // Query zones table for ZIP match
    const zone = await db.query.serviceTitanZones.findFirst({
      where: sql`${cleanedZip} = ANY(${serviceTitanZones.zipCodes})`,
    });
    
    return zone?.name || null;
  } catch (error) {
    console.error('[Smart Scheduler] Error looking up zone:', error);
    return null;
  }
}

/**
 * Parse zone number from zone name
 * Example: "3 - Central" → 3, "Hill Country" → 7 (special case)
 */
function parseZoneNumber(zoneName: string | null): number | null {
  if (!zoneName) return null;
  
  // Special case: Hill Country doesn't have a number prefix, assign zone 7
  if (zoneName.toLowerCase().includes('hill country')) {
    return 7;
  }
  
  const match = zoneName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Calculate zone adjacency score
 * Same zone: 95, Adjacent (±1): 80, Two away (±2): 65, Far (±3+): 45
 */
function getZoneAdjacencyScore(customerZoneNum: number | null, jobZoneNum: number | null): number {
  if (!customerZoneNum || !jobZoneNum) return 0;
  
  const distance = Math.abs(customerZoneNum - jobZoneNum);
  if (distance === 0) return 95; // Same zone
  if (distance === 1) return 80; // Adjacent zone
  if (distance === 2) return 65; // Two zones away
  return 45; // Far away
}

/**
 * NEW Proximity Algorithm V2
 * Scores based on:
 * 1. Technician route contiguity (appointments within 2-3 hours in same/adjacent zones)
 * 2. Zone adjacency (same zone = best, adjacent zones = good, far = poor)
 * 3. Same-day job clustering (more jobs same day in nearby zones = better)
 * 
 * Returns: { score: number, technicianId: number | null }
 */
function calculateProximityScoreV2(
  slotStart: Date,
  slotEnd: Date,
  customerZoneNumber: number | null,
  sameDayJobs: any[],
  zipToZone: Record<string, string>,
  normalizeZip: (zip: string | null | undefined) => string | null,
  parseZoneNumber: (zoneName: string | null) => number | null
): { score: number; technicianId: number | null } {
  if (!customerZoneNumber) {
    // No zone info = neutral score, no tech assignment
    return { score: 50, technicianId: null };
  }

  // Group jobs by technician
  const jobsByTech = new Map<number, any[]>();
  for (const job of sameDayJobs) {
    if (job.technicianId) {
      if (!jobsByTech.has(job.technicianId)) {
        jobsByTech.set(job.technicianId, []);
      }
      jobsByTech.get(job.technicianId)!.push(job);
    }
  }

  let bestScore = 50; // Base score
  let bestTechnicianId: number | null = null; // Track best technician

  // Check each technician's schedule for contiguous opportunities
  for (const [techId, techJobs] of jobsByTech.entries()) {
    // Sort jobs by time
    const sortedJobs = techJobs.sort((a, b) => 
      new Date(a.appointmentStart).getTime() - new Date(b.appointmentStart).getTime()
    );

    // Check for contiguous appointments (within 3 hours before/after our slot)
    const contiguityWindow = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    
    for (const job of sortedJobs) {
      const jobStart = new Date(job.appointmentStart);
      const jobEnd = new Date(job.appointmentEnd);
      const jobZip = normalizeZip(job.locationZip);
      const jobZoneName = jobZip ? zipToZone[jobZip] : null;
      const jobZoneNum = parseZoneNumber(jobZoneName);

      // Check if job is within contiguity window
      const timeBefore = slotStart.getTime() - jobEnd.getTime();
      const timeAfter = jobStart.getTime() - slotEnd.getTime();
      
      const isContiguous = (
        (timeBefore >= 0 && timeBefore <= contiguityWindow) || // Job ends before our slot
        (timeAfter >= 0 && timeAfter <= contiguityWindow)      // Job starts after our slot
      );

      if (isContiguous) {
        // Calculate zone adjacency score
        const zoneScore = getZoneAdjacencyScore(customerZoneNumber, jobZoneNum);
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          const slotTime = format(slotStart, 'h:mm a');
          const jobTime = format(jobStart, 'h:mm a');
          console.log(`[Proximity] ${slotTime} slot near ${jobTime} job: zone score ${zoneScore} (customer zone ${customerZoneNumber}, job zone ${jobZoneNum}) - Tech ${techId}`);
        }
        
        // Track best technician for this slot
        if (zoneScore > bestScore) {
          bestScore = zoneScore;
          bestTechnicianId = techId;
        }
      }
    }
  }

  // Boost score if there are multiple jobs in same/adjacent zones that day (even if not contiguous)
  const jobsInNearbyZones = sameDayJobs.filter(job => {
    const jobZip = normalizeZip(job.locationZip);
    const jobZoneName = jobZip ? zipToZone[jobZip] : null;
    const jobZoneNum = parseZoneNumber(jobZoneName);
    
    if (!jobZoneNum) return false;
    const distance = Math.abs(customerZoneNumber - jobZoneNum);
    return distance <= 1; // Same zone or adjacent
  });

  // Bonus for clustering (more jobs nearby that day = better)
  if (jobsInNearbyZones.length >= 3) {
    bestScore = Math.min(100, bestScore + 10);
  } else if (jobsInNearbyZones.length >= 2) {
    bestScore = Math.min(100, bestScore + 5);
  }

  // FALLBACK: If no proximity match found, assign any technician working that day
  if (bestTechnicianId === null && sameDayJobs.length > 0) {
    // Find first technician with jobs that day
    const firstTech = sameDayJobs.find(job => job.technicianId)?.technicianId;
    if (firstTech) {
      bestTechnicianId = firstTech;
      console.log(`[Proximity] No proximity match - assigning fallback tech ${firstTech} for same-day job`);
    }
  }

  return { 
    score: Math.min(bestScore, 100),
    technicianId: bestTechnicianId
  };
}

/**
 * Map a 2-hour slot to its corresponding arrival window
 * 
 * REGULAR SERVICES (4-hour windows):
 * - 8-10am or 10-12pm → 8am-12pm arrival window
 * - 12-2pm or 2-4pm → 12pm-4pm arrival window
 * - 4-6pm → 4pm-8pm arrival window
 * 
 * BACKFLOW TESTING (12-hour window):
 * - 8am-8pm → 8am-8pm arrival window (all-day)
 */
function get4HourArrivalWindow(twoHourStart: string, twoHourEnd: string, isBackflow: boolean = false): { windowStart: string; windowEnd: string; windowLabel: string } {
  const start = new Date(twoHourStart);
  const end = new Date(twoHourEnd);
  const startHour = parseInt(start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Chicago',
  }));
  
  const endHour = parseInt(end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Chicago',
  }));
  
  let windowStartHour: number;
  let windowEndHour: number;
  
  // BACKFLOW: Return the full 12-hour window as-is
  if (isBackflow && startHour === 8 && endHour === 20) {
    windowStartHour = 8;
    windowEndHour = 20;
  } else if (startHour >= 8 && startHour < 12) {
    // 8-10am or 10-12pm → 8am-12pm window
    windowStartHour = 8;
    windowEndHour = 12;
  } else if (startHour >= 12 && startHour < 16) {
    // 12-2pm or 2-4pm → 12pm-4pm window
    windowStartHour = 12;
    windowEndHour = 16;
  } else {
    // 4-6pm → 4pm-8pm window
    windowStartHour = 16;
    windowEndHour = 20;
  }
  
  // Create window times
  const dayStr = formatInTimeZone(start, 'America/Chicago', 'yyyy-MM-dd');
  const windowStart = fromZonedTime(`${dayStr}T${String(windowStartHour).padStart(2, '0')}:00:00`, 'America/Chicago');
  const windowEnd = fromZonedTime(`${dayStr}T${String(windowEndHour).padStart(2, '0')}:00:00`, 'America/Chicago');
  
  // Format label
  const startLabel = windowStartHour < 12 
    ? `${windowStartHour}:00 AM`
    : windowStartHour === 12
    ? `12:00 PM`
    : `${windowStartHour - 12}:00 PM`;
  const endLabel = windowEndHour <= 12
    ? `${windowEndHour}:00 PM` // Noon is PM
    : `${windowEndHour - 12}:00 PM`;
  
  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    windowLabel: `${startLabel} - ${endLabel}`,
  };
}

function formatTimeWindow(start: string, end: string): string {
  // Format times in Central Time (America/Chicago timezone)
  const startTime = new Date(start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago', // Display in Central Time
  });
  const endTime = new Date(end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago', // Display in Central Time
  });
  return `${startTime} - ${endTime}`;
}

function getTimePeriod(start: string): 'morning' | 'afternoon' | 'evening' {
  // Get hour in Central Time for period classification
  const hour = parseInt(new Date(start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Chicago',
  }));
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * DEPRECATED FUNCTIONS - Now using ServiceTitan Capacity API
 * 
 * The following functions are no longer needed because the Capacity API:
 * - Automatically accounts for regular job appointments
 * - Automatically accounts for non-job appointments (lunch, meetings, PTO)
 * - Automatically accounts for technician availability
 * - Uses ServiceTitan's actual arrival windows (not hardcoded)
 * - Returns only truly available slots
 * 
 * Removed:
 * - fetchAppointments() - replaced by Capacity API
 * - getArrivalWindows() - replaced by Capacity API
 * - generateAvailableSlots() - replaced by Capacity API
 */
