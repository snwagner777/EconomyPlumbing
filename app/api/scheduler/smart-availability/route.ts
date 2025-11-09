/**
 * Smart Scheduler Availability API V2
 * 
 * Uses ServiceTitan's dynamic arrival windows with smart 2-hour appointment booking:
 * - Requests 7 full days (midnight-to-midnight) to get ALL arrival windows
 * - Uses API-returned windows dynamically (8-12pm, 9-1pm, 10-2pm, etc.)
 * - Calculates optimal 2-hour appointment slots within each arrival window
 * - Scores based on proximity to existing technician jobs for fuel efficiency
 * - Customer sees 4-hour arrival windows, we book 2-hour appointments internally
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { db } from '@/server/db';
import { serviceTitanZones } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { format, addDays, addHours } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'America/Chicago';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface SmartAvailabilityRequest {
  jobTypeId: number;
  businessUnitId?: number;
  customerZip?: string;
  customerAddress?: string;
  startDate: string;
  daysToLoad?: number; // Support pagination (7, 14, 21, etc.)
}

interface ScoredSlot {
  id: string;
  start: string; // 2-hour appointment booking time start
  end: string; // 2-hour appointment booking time end
  arrivalWindowStart: string; // Customer-facing arrival window start
  arrivalWindowEnd: string; // Customer-facing arrival window end
  date: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  proximityScore: number; // 0-100, higher = more fuel efficient
  nearbyJobs: number; // Count of jobs in same zone during this window
  zone?: string;
  technicianId?: number | null; // Pre-assigned technician for optimal routing
  availableCapacity?: number;
  totalCapacity?: number;
}

interface CapacityWindow {
  start: string;
  end: string;
  isAvailable: boolean;
  availableCapacity?: number;
  totalCapacity?: number;
  technicianIds?: number[];
}

// Simple in-memory cache
const availabilityCache = new Map<string, { data: any; timestamp: number }>();

export async function POST(req: NextRequest) {
  try {
    const body: SmartAvailabilityRequest = await req.json();
    const { jobTypeId, businessUnitId, customerZip, customerAddress, startDate, daysToLoad = 7 } = body;
    
    if (!jobTypeId || !startDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: jobTypeId and startDate',
        },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cacheKey = `${jobTypeId}-${businessUnitId || 'default'}-${customerZip || 'nozip'}-${startDate}-${daysToLoad}`;
    const cached = availabilityCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log(`[Smart Scheduler] Cache hit for ${cacheKey}`);
      return NextResponse.json(cached.data);
    }
    
    // Parse dates as Central Time midnight to avoid timezone bugs
    const start = fromZonedTime(`${startDate}T00:00:00`, TIMEZONE);
    const endDate = addDays(start, daysToLoad - 1);
    
    console.log(`[Smart Scheduler] Fetching ${daysToLoad} days from ${formatInTimeZone(start, TIMEZONE, 'yyyy-MM-dd')} to ${formatInTimeZone(endDate, TIMEZONE, 'yyyy-MM-dd')}`);
    
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
        return NextResponse.json({ success: false, error: 'No business unit found' }, { status: 500 });
      }
    }
    
    // STEP 1: Request full days (midnight-to-midnight) from Capacity API
    // This ensures we get ALL arrival windows (including morning slots)
    console.log(`[Smart Scheduler] Requesting ${daysToLoad} full days (midnight-to-midnight)...`);
    
    const capacityRequests = [];
    for (let i = 0; i < daysToLoad; i++) {
      const dayStart = fromZonedTime(formatInTimeZone(addDays(start, i), TIMEZONE, 'yyyy-MM-dd') + 'T00:00:00', TIMEZONE);
      const dayEnd = fromZonedTime(formatInTimeZone(addDays(start, i), TIMEZONE, 'yyyy-MM-dd') + 'T23:59:59', TIMEZONE);
      
      capacityRequests.push(
        serviceTitanSettings.checkCapacity({
          businessUnitId: actualBusinessUnitId,
          jobTypeId,
          startDate: dayStart,
          endDate: dayEnd,
          skillBasedAvailability: true,
        })
      );
    }
    
    // Parallelize capacity requests for performance
    const capacityResults = await Promise.all(capacityRequests);
    const allCapacityWindows: CapacityWindow[] = capacityResults.flat().filter(w => 
      w.isAvailable // Keep all available windows (backflow may not have availableCapacity defined)
    );
    
    console.log(`[Smart Scheduler] Capacity API returned ${allCapacityWindows.length} available windows across ${daysToLoad} days`);
    
    // STEP 2: Filter windows based on job type
    // Regular services: 4-hour windows only (filter out 12-hour)
    // Backflow: 12-hour windows only (filter out 4-hour)
    const filteredWindows = allCapacityWindows.filter(window => {
      const windowStart = new Date(window.start);
      const windowEnd = new Date(window.end);
      const durationHours = (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60);
      
      if (isBackflowJob) {
        // Backflow: Only show 12-hour windows (8am-8pm)
        return durationHours === 12;
      } else {
        // Regular services: Only show 4-hour windows (8-12, 9-1, 10-2, etc.)
        return durationHours === 4;
      }
    });
    
    console.log(`[Smart Scheduler] After filtering: ${filteredWindows.length} ${isBackflowJob ? '12-hour' : '4-hour'} windows`);
    
    // STEP 3: Fetch existing jobs for proximity scoring
    const existingJobs = await serviceTitanJobs.getJobsForDateRange(start, endDate);
    console.log(`[Smart Scheduler] Found ${existingJobs.length} existing jobs for proximity scoring`);
    
    // Fetch technician assignments
    const appointmentIds = existingJobs.map(j => j.appointmentId);
    const techAssignments = await serviceTitanJobs.getTechnicianAssignments(appointmentIds, start, endDate);
    existingJobs.forEach(job => {
      job.technicianId = techAssignments.get(job.appointmentId);
    });
    
    // STEP 4: Generate 2-hour appointment slots within each arrival window
    // Customer sees 4-hour window (e.g., "8am-12pm"), we book 2-hour slots internally
    const allSlots: ScoredSlot[] = [];
    
    // Fetch customer zone info for proximity scoring
    const serviceLocationZone = customerZip ? await getZoneForZip(customerZip) : null;
    const serviceLocationZoneNumber = serviceLocationZone ? parseZoneNumber(serviceLocationZone) : null;
    console.log(`[Smart Scheduler] Customer ZIP: ${customerZip}, Zone: ${serviceLocationZone} (#${serviceLocationZoneNumber || 'unknown'})`);
    
    // Precompute ZIP-to-zone mapping for existing jobs
    const normalizeZip = (zip: string | null | undefined): string | null => {
      if (!zip) return null;
      const digits = zip.replace(/\D/g, '').substring(0, 5);
      return digits.length === 5 ? digits : null;
    };
    
    const uniqueZips = [...new Set(existingJobs.map(j => normalizeZip(j.locationZip)).filter((z): z is string => z !== null))];
    const zipToZone: Record<string, string> = {};
    
    if (uniqueZips.length > 0) {
      const zones = await db.query.serviceTitanZones.findMany({
        where: (zones) => sql`${zones.zipCodes} && ARRAY[${sql.join(uniqueZips.map(z => sql`${z}`), sql`, `)}]::text[]`,
      });
      
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
    
    // Generate 2-hour slots for each arrival window
    for (const window of filteredWindows) {
      const windowStart = new Date(window.start);
      const windowEnd = new Date(window.end);
      const windowDurationHours = (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60);
      
      // For backflow (12-hour), create one 12-hour slot
      // For regular services (4-hour), create hourly-aligned 2-hour slots
      const slotsInWindow: Array<{ start: Date; end: Date }> = [];
      
      if (windowDurationHours === 12) {
        // Backflow: One 12-hour appointment
        slotsInWindow.push({ start: windowStart, end: windowEnd });
      } else {
        // Regular: Generate all possible 2-hour slots (hourly aligned)
        // E.g., 8-12pm window → [8-10am, 9-11am, 10am-12pm]
        for (let hour = 0; hour < windowDurationHours - 1; hour++) {
          const slotStart = addHours(windowStart, hour);
          const slotEnd = addHours(slotStart, 2);
          
          // Ensure slot doesn't extend beyond window
          if (slotEnd <= windowEnd) {
            slotsInWindow.push({ start: slotStart, end: slotEnd });
          }
        }
      }
      
      // Score each 2-hour slot and create ScoredSlot objects
      for (let slotIndex = 0; slotIndex < slotsInWindow.length; slotIndex++) {
        const slot = slotsInWindow[slotIndex];
        const slotDate = format(slot.start, 'yyyy-MM-dd');
        
        // Find jobs on same day for proximity scoring
        const sameDayJobs = existingJobs.filter(job => {
          const jobDate = format(new Date(job.appointmentStart), 'yyyy-MM-dd');
          return jobDate === slotDate;
        });
        
        // Hill Country restriction: block certain afternoon windows unless HC job exists
        if (serviceLocationZone?.toLowerCase().includes('hill country')) {
          const startHour = parseInt(slot.start.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: TIMEZONE }));
          const endHour = parseInt(slot.end.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: TIMEZONE }));
          
          // Blocked windows: 10-2, 11-3, 12-4, 1-5, 2-6
          const isBlockedWindow = [
            [10, 14], [11, 15], [12, 16], [13, 17], [14, 18]
          ].some(([s, e]) => startHour === s && endHour === e);
          
          if (isBlockedWindow) {
            const hcJobsToday = sameDayJobs.filter(job => {
              const jobZip = normalizeZip(job.locationZip);
              const jobZone = jobZip ? zipToZone[jobZip] : null;
              return jobZone?.toLowerCase().includes('hill country');
            });
            
            if (hcJobsToday.length === 0) {
              console.log(`[Hill Country] Blocking ${format(slot.start, 'ha')}-${format(slot.end, 'ha')} - no HC jobs that day`);
              continue; // Skip this slot
            }
          }
        }
        
        // Calculate proximity score
        const proximityResult = calculateProximityScoreV2(
          slot.start,
          slot.end,
          serviceLocationZoneNumber,
          sameDayJobs,
          zipToZone,
          normalizeZip,
          parseZoneNumber
        );
        
        // Count nearby jobs
        const nearbyJobCount = sameDayJobs.filter(job => {
          const jobZip = normalizeZip(job.locationZip);
          const jobZone = jobZip ? zipToZone[jobZip] : null;
          const jobZoneNum = parseZoneNumber(jobZone);
          if (!serviceLocationZoneNumber || !jobZoneNum) return false;
          return Math.abs(serviceLocationZoneNumber - jobZoneNum) <= 1;
        }).length;
        
        // Format time label
        const startLabel = slot.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE });
        const endLabel = slot.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE });
        
        allSlots.push({
          id: `slot-${allSlots.length}`,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          arrivalWindowStart: window.start,
          arrivalWindowEnd: window.end,
          date: slotDate,
          timeLabel: `${startLabel} - ${endLabel}`,
          period: getTimePeriod(slot.start.toISOString()),
          proximityScore: proximityResult.score,
          nearbyJobs: nearbyJobCount,
          zone: serviceLocationZone || undefined,
          technicianId: proximityResult.technicianId,
          availableCapacity: window.availableCapacity,
          totalCapacity: window.totalCapacity,
        });
      }
    }
    
    console.log(`[Smart Scheduler] Generated ${allSlots.length} 2-hour appointment slots`);
    
    // STEP 5: Sort by proximity score (highest first), then by time for ties
    const scoredSlots = allSlots.sort((a, b) => {
      const scoreDiff = b.proximityScore - a.proximityScore;
      if (scoreDiff === 0) {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      }
      return scoreDiff;
    });
    
    // Log top 10 slots
    console.log(`[Smart Scheduler] Top 10 slots by score:`);
    scoredSlots.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.timeLabel} (arrival window ${new Date(s.arrivalWindowStart).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: TIMEZONE })}-${new Date(s.arrivalWindowEnd).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: TIMEZONE })}) - Score: ${s.proximityScore}`);
    });
    
    // STEP 6: Build response and cache it
    const response = {
      success: true,
      slots: scoredSlots,
      optimization: {
        customerZone: serviceLocationZone,
        totalSlots: scoredSlots.length,
        optimizedSlots: scoredSlots.filter(s => s.proximityScore > 50).length,
      },
    };
    
    // Cache the response
    availabilityCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });
    
    console.log(`[Smart Scheduler] Cached response for ${cacheKey}`);
    
    return NextResponse.json(response);
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
