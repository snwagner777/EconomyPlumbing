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
  const { db } = await import('@/server/db');
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
          skillBasedAvailability: false, // Always false - show all techs
        })
      );
    }
    
    // Parallelize capacity requests for performance
    const capacityResults = await Promise.all(capacityRequests);
    const allCapacityWindows: CapacityWindow[] = capacityResults.flat().filter(w => {
      // Must be available AND have at least 2 hours capacity (for 2-hour appointments)
      // Capacity represents hours available, we need minimum 2 hours to book
      return w.isAvailable && (w.availableCapacity === undefined || w.availableCapacity >= 2);
    });
    
    console.log(`[Smart Scheduler] Capacity API returned ${allCapacityWindows.length} available windows with 2+ hours capacity across ${daysToLoad} days`);
    
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
    
    // Fetch customer zone info for proximity scoring (check ZIP first, then city for Hill Country)
    const serviceLocationZone = customerZip ? await getZoneForZip(customerZip) : null;
    const serviceLocationZoneNumber = serviceLocationZone ? parseZoneNumber(serviceLocationZone) : null;
    console.log(`[Smart Scheduler] Customer ZIP: ${customerZip}, Zone: ${serviceLocationZone} (#${serviceLocationZoneNumber || 'unknown'})`);
    
    // Precompute ZIP-to-zone and city-to-zone mappings for existing jobs
    const normalizeZip = (zip: string | null | undefined): string | null => {
      if (!zip) return null;
      const digits = zip.replace(/\D/g, '').substring(0, 5);
      return digits.length === 5 ? digits : null;
    };
    
    const normalizeCity = (city: string | null | undefined): string | null => {
      if (!city) return null;
      return city.toLowerCase().trim();
    };
    
    const uniqueZips = [...new Set(existingJobs.map(j => normalizeZip(j.locationZip)).filter((z): z is string => z !== null))];
    const uniqueCities = [...new Set(existingJobs.map(j => normalizeCity(j.locationCity)).filter((c): c is string => c !== null))];
    const zipToZone: Record<string, string> = {};
    const cityToZone: Record<string, string> = {};
    
    // Fetch all zones for mapping
    const allZones = await db.query.serviceTitanZones.findMany();
    
    // Build ZIP-to-zone mapping
    if (uniqueZips.length > 0) {
      for (const zone of allZones) {
        for (const zip of zone.zipCodes) {
          const normalized = normalizeZip(zip);
          if (normalized && uniqueZips.includes(normalized)) {
            zipToZone[normalized] = zone.name;
          }
        }
      }
      console.log(`[Smart Scheduler] Mapped ${Object.keys(zipToZone).length} ZIPs to zones`);
    }
    
    // Build city-to-zone mapping (CRITICAL for Hill Country which uses city names)
    if (uniqueCities.length > 0) {
      for (const zone of allZones) {
        if (zone.cities && zone.cities.length > 0) {
          for (const city of zone.cities) {
            const normalized = normalizeCity(city);
            if (normalized && uniqueCities.includes(normalized)) {
              cityToZone[normalized] = zone.name;
            }
          }
        }
      }
      console.log(`[Smart Scheduler] Mapped ${Object.keys(cityToZone).length} cities to zones`);
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
              // Check ZIP first, then city (Hill Country uses city names)
              const jobZip = normalizeZip(job.locationZip);
              const jobCity = normalizeCity(job.locationCity);
              const jobZone = (jobZip && zipToZone[jobZip]) || (jobCity && cityToZone[jobCity]) || null;
              return jobZone?.toLowerCase().includes('hill country');
            });
            
            if (hcJobsToday.length === 0) {
              console.log(`[Hill Country] Blocking ${format(slot.start, 'ha')}-${format(slot.end, 'ha')} - no HC jobs that day`);
              continue; // Skip this slot
            }
          }
        }
        
        // Calculate proximity score and assign technician
        // Pass available techs from capacity API for fallback assignment
        const proximityResult = calculateProximityScoreV2(
          slot.start,
          slot.end,
          serviceLocationZoneNumber,
          serviceLocationZone, // Pass zone name for name-based matching (Hill Country, etc.)
          sameDayJobs,
          zipToZone,
          cityToZone, // Pass city-to-zone mapping for Hill Country
          normalizeZip,
          normalizeCity,
          parseZoneNumber,
          window.technicianIds || [] // Available techs for this time slot from capacity API
        );
        
        // Count nearby jobs (check both ZIP and city for zone matching)
        const nearbyJobCount = sameDayJobs.filter(job => {
          const jobZip = normalizeZip(job.locationZip);
          const jobCity = normalizeCity(job.locationCity);
          const jobZone = (jobZip && zipToZone[jobZip]) || (jobCity && cityToZone[jobCity]) || null;
          const jobZoneNum = parseZoneNumber(jobZone);
          if (!serviceLocationZoneNumber || !jobZoneNum) return false;
          return Math.abs(serviceLocationZoneNumber - jobZoneNum) <= 1;
        }).length;
        
        // Format time label - use ARRIVAL WINDOW times (4-hour windows for customers)
        // Internal booking uses 2-hour slots, but customer sees 4-hour arrival windows
        const arrivalStart = new Date(window.start);
        const arrivalEnd = new Date(window.end);
        const startLabel = arrivalStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE });
        const endLabel = arrivalEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TIMEZONE });
        
        allSlots.push({
          id: `slot-${allSlots.length}`,
          start: slot.start.toISOString(), // Internal 2-hour booking slot
          end: slot.end.toISOString(),     // Internal 2-hour booking slot
          arrivalWindowStart: window.start, // Customer-facing 4-hour window
          arrivalWindowEnd: window.end,     // Customer-facing 4-hour window
          date: slotDate,
          timeLabel: `${startLabel} - ${endLabel}`, // Show 4-hour arrival window to customer
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
    
    // STEP 5: Deduplicate by arrival window (customer-facing contract)
    // Multiple 2-hour internal slots share the same 4-hour arrival window
    // Group by window and select the best-scored slot for each
    const slotsByWindow = new Map<string, ScoredSlot[]>();
    
    for (const slot of allSlots) {
      const windowKey = `${slot.date}-${slot.arrivalWindowStart}-${slot.arrivalWindowEnd}`;
      if (!slotsByWindow.has(windowKey)) {
        slotsByWindow.set(windowKey, []);
      }
      slotsByWindow.get(windowKey)!.push(slot);
    }
    
    // For each window, keep only the best-scored 2-hour booking slot
    const deduplicatedSlots: ScoredSlot[] = [];
    for (const [windowKey, windowSlots] of slotsByWindow) {
      // Sort by proximity score (highest first)
      windowSlots.sort((a, b) => b.proximityScore - a.proximityScore);
      
      // Keep the best-scored slot for this arrival window
      const bestSlot = windowSlots[0];
      deduplicatedSlots.push(bestSlot);
    }
    
    console.log(`[Smart Scheduler] Deduplicated ${allSlots.length} slots → ${deduplicatedSlots.length} unique arrival windows`);
    
    // STEP 6: Sort by proximity score (highest first), then by time for ties
    const scoredSlots = deduplicatedSlots.sort((a, b) => {
      const scoreDiff = b.proximityScore - a.proximityScore;
      if (scoreDiff === 0) {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      }
      return scoreDiff;
    });
    
    // Log top 10 slots
    console.log(`[Smart Scheduler] Top 10 unique arrival windows by score:`);
    scoredSlots.slice(0, 10).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.timeLabel} (internal booking: ${new Date(s.start).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: TIMEZONE })}-${new Date(s.end).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: TIMEZONE })}) - Score: ${s.proximityScore}`);
    });
    
    // STEP 7: Build response and cache it
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
 * Handles both numbered zones (1-6) and named zones (Hill Country)
 * Same zone: 95, Adjacent (±1): 80, Two away (±2): 65, Far (±3+): 45
 */
function getZoneAdjacencyScore(
  customerZoneNum: number | null, 
  jobZoneNum: number | null,
  customerZoneName: string | null = null,
  jobZoneName: string | null = null
): number {
  if (!customerZoneNum || !jobZoneNum) {
    // Fallback to name-based matching for zones without numbers (e.g., Hill Country)
    if (customerZoneName && jobZoneName) {
      const customerLower = customerZoneName.toLowerCase();
      const jobLower = jobZoneName.toLowerCase();
      
      // Exact name match = same zone
      if (customerLower === jobLower) {
        return 95;
      }
      
      // Hill Country adjacency: geographically close to Bee Cave/Lake Travis (zone 6)
      const isHillCountry = (name: string) => name.includes('hill country');
      const isBeeCave = (name: string) => name.includes('bee cave') || name.includes('lake travis');
      
      if ((isHillCountry(customerLower) && isBeeCave(jobLower)) ||
          (isBeeCave(customerLower) && isHillCountry(jobLower))) {
        return 80; // Adjacent zones
      }
      
      // Different named zones = far
      return 45;
    }
    return 0; // No zone info available
  }
  
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
  customerZoneName: string | null,
  sameDayJobs: any[],
  zipToZone: Record<string, string>,
  cityToZone: Record<string, string>,
  normalizeZip: (zip: string | null | undefined) => string | null,
  normalizeCity: (city: string | null | undefined) => string | null,
  parseZoneNumber: (zoneName: string | null) => number | null,
  availableTechnicianIds: number[] = [] // Technicians available from capacity API
): { score: number; technicianId: number | null } {
  if (!customerZoneNumber) {
    // No zone info = neutral score, but still assign an available tech
    const techId = availableTechnicianIds.length > 0 ? availableTechnicianIds[0] : null;
    if (techId && process.env.NODE_ENV === 'development') {
      console.log(`[Proximity] No zone info for customer - assigning available tech ${techId}`);
    }
    return { score: 50, technicianId: techId };
  }

  // Group jobs by technician
  const jobsByTech = new Map<number, any[]>();
  const jobsWithoutTech: any[] = [];
  
  for (const job of sameDayJobs) {
    if (job.technicianId) {
      if (!jobsByTech.has(job.technicianId)) {
        jobsByTech.set(job.technicianId, []);
      }
      jobsByTech.get(job.technicianId)!.push(job);
    } else {
      jobsWithoutTech.push(job);
    }
  }
  
  // Warn about jobs without technician assignments
  if (jobsWithoutTech.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`[Proximity] Warning: ${jobsWithoutTech.length} jobs have no technician assignment - cannot optimize routing`);
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
      const jobCity = normalizeCity(job.locationCity);
      // Check ZIP first, then city (Hill Country uses city names)
      const jobZoneName = (jobZip && zipToZone[jobZip]) || (jobCity && cityToZone[jobCity]) || null;
      const jobZoneNum = parseZoneNumber(jobZoneName);

      // Check if job is within contiguity window
      const timeBefore = slotStart.getTime() - jobEnd.getTime();
      const timeAfter = jobStart.getTime() - slotEnd.getTime();
      
      const isContiguous = (
        (timeBefore >= 0 && timeBefore <= contiguityWindow) || // Job ends before our slot
        (timeAfter >= 0 && timeAfter <= contiguityWindow)      // Job starts after our slot
      );

      if (isContiguous) {
        // Calculate zone adjacency score (with name-based fallback for zones like Hill Country)
        const zoneScore = getZoneAdjacencyScore(customerZoneNumber, jobZoneNum, customerZoneName, jobZoneName);
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          const slotTime = format(slotStart, 'h:mm a');
          const jobTime = format(jobStart, 'h:mm a');
          console.log(`[Proximity] ${slotTime} slot near ${jobTime} job: zone score ${zoneScore} (customer: ${customerZoneName || customerZoneNumber}, job: ${jobZoneName || jobZoneNum}) - Tech ${techId}`);
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
    const jobCity = normalizeCity(job.locationCity);
    // Check ZIP first, then city (Hill Country uses city names)
    const jobZoneName = (jobZip && zipToZone[jobZip]) || (jobCity && cityToZone[jobCity]) || null;
    const jobZoneNum = parseZoneNumber(jobZoneName);
    
    if (!jobZoneNum) return false;
    const distance = Math.abs(customerZoneNumber - jobZoneNum);
    return distance <= 1; // Same zone or adjacent
  });

  // BUGFIX: Only apply clustering bonus if we actually found a contiguous proximity match
  // Otherwise slots with zero proximity get boosted incorrectly
  if (bestTechnicianId !== null) {
    // We found a contiguous match - apply clustering bonus
    if (jobsInNearbyZones.length >= 3) {
      bestScore = Math.min(100, bestScore + 10);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Proximity] Clustering bonus +10: ${jobsInNearbyZones.length} nearby jobs → score ${bestScore}`);
      }
    } else if (jobsInNearbyZones.length >= 2) {
      bestScore = Math.min(100, bestScore + 5);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Proximity] Clustering bonus +5: ${jobsInNearbyZones.length} nearby jobs → score ${bestScore}`);
      }
    }
  }

  // FALLBACK: If no proximity match found, assign any available technician from capacity API
  // This ensures we use techs who are actually available for this time slot
  if (bestTechnicianId === null && availableTechnicianIds.length > 0) {
    // Pick first available technician from capacity API for this time slot
    bestTechnicianId = availableTechnicianIds[0];
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Proximity] No proximity match - assigning available tech ${bestTechnicianId} from capacity API (${availableTechnicianIds.length} available)`);
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
