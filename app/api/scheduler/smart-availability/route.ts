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
  start: string;
  end: string;
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
    
    // Fetch existing appointments and jobs
    const appointments = await fetchAppointments(start, end);
    console.log(`[Smart Scheduler] Found ${appointments.length} existing appointments`);
    
    // Get hardcoded arrival windows (business hours: 8-12, 9-1, 10-2, 11-3, 12-4, 1-5, 2-6, 3-7, 4-8)
    const arrivalWindows = getArrivalWindows();
    console.log(`[Smart Scheduler] Using ${arrivalWindows.length} hardcoded arrival windows`);
    
    // Generate available slots using arrival windows
    const availableSlots = generateAvailableSlots(start, end, appointments, arrivalWindows);
    console.log(`[Smart Scheduler] Generated ${availableSlots.length} available slots`);
    
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
    const scoredSlots = availableSlots.map((slot, index): ScoredSlot | null => {
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

      return {
        id: `slot-${index}`,
        start: slot.start,
        end: slot.end,
        date: slot.start.split('T')[0],
        timeLabel: formatTimeWindow(slot.start, slot.end),
        period: getTimePeriod(slot.start),
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
 * Fetch appointments from ServiceTitan for date range
 */
async function fetchAppointments(startDate: Date, endDate: Date): Promise<Appointment[]> {
  try {
    const tenantId = serviceTitanAuth.getTenantId();
    const queryParams = new URLSearchParams({
      startsOnOrAfter: startDate.toISOString(),
      startsOnOrBefore: endDate.toISOString(),
      pageSize: '500',
    });
    
    const response = await serviceTitanAuth.makeRequest<{ data: Appointment[] }>(
      `jpm/v2/tenant/${tenantId}/appointments?${queryParams.toString()}`
    );
    
    return response.data || [];
  } catch (error) {
    console.error('[Smart Scheduler] Error fetching appointments:', error);
    return [];
  }
}

/**
 * Get hardcoded arrival windows based on actual business hours
 * Windows: 8-12, 9-1, 10-2, 11-3, 12-4, 1-5, 2-6, 3-7, 4-8
 */
function getArrivalWindows(): Array<{ start: string; end: string; durationHours: number }> {
  return [
    { start: '08:00', end: '12:00', durationHours: 4 }, // 8 AM - 12 PM
    { start: '09:00', end: '13:00', durationHours: 4 }, // 9 AM - 1 PM
    { start: '10:00', end: '14:00', durationHours: 4 }, // 10 AM - 2 PM
    { start: '11:00', end: '15:00', durationHours: 4 }, // 11 AM - 3 PM
    { start: '12:00', end: '16:00', durationHours: 4 }, // 12 PM - 4 PM
    { start: '13:00', end: '17:00', durationHours: 4 }, // 1 PM - 5 PM
    { start: '14:00', end: '18:00', durationHours: 4 }, // 2 PM - 6 PM
    { start: '15:00', end: '19:00', durationHours: 4 }, // 3 PM - 7 PM
    { start: '16:00', end: '20:00', durationHours: 4 }, // 4 PM - 8 PM
  ];
}

/**
 * Generate available time slots based on arrival windows and existing appointments
 * CRITICAL: All date/time logic operates in Central Time to avoid timezone bugs
 */
function generateAvailableSlots(
  startDate: Date,
  endDate: Date,
  bookedAppointments: Appointment[],
  arrivalWindows: Array<{ start: string; end: string; durationHours: number }>
): Array<{ start: string; end: string }> {
  const TIMEZONE = 'America/Chicago';
  const slots: Array<{ start: string; end: string }> = [];
  
  // Convert UTC dates to Central Time for iteration
  let currentDateCT = toZonedTime(startDate, TIMEZONE);
  const endDateCT = toZonedTime(endDate, TIMEZONE);
  
  console.log(`[Slot Generation] Checking dates ${formatInTimeZone(currentDateCT, TIMEZONE, 'MMM d yyyy')} to ${formatInTimeZone(endDateCT, TIMEZONE, 'MMM d yyyy')}`);
  console.log(`[Slot Generation] Found ${bookedAppointments.length} existing appointments to check for conflicts`);
  
  while (currentDateCT <= endDateCT) {
    // Check day of week in Central Time
    const dayOfWeek = currentDateCT.getDay(); // 0=Sunday, 6=Saturday
    
    // NEVER allow weekend bookings - skip Saturday and Sunday completely
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDateCT = addDays(currentDateCT, 1);
      continue;
    }
    
    // Extract date components in Central Time
    const year = currentDateCT.getFullYear();
    const month = currentDateCT.getMonth() + 1;
    const day = currentDateCT.getDate();
    
    // Generate slots for each arrival window
    arrivalWindows.forEach(window => {
      const [startHour, startMin] = window.start.split(':').map(Number);
      const [endHour, endMin] = window.end.split(':').map(Number);
      
      // Build ISO string for Central Time slot (YYYY-MM-DDTHH:MM:SS)
      const slotStartStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(startHour).padStart(2, '0')}:${String(startMin || 0).padStart(2, '0')}:00`;
      const slotEndStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(endHour).padStart(2, '0')}:${String(endMin || 0).padStart(2, '0')}:00`;
      
      // Convert Central Time to UTC
      const slotStart = fromZonedTime(slotStartStr, TIMEZONE);
      const slotEnd = fromZonedTime(slotEndStr, TIMEZONE);
      
      // Check for conflicts with existing appointments
      // Arrival windows are 4 hours but actual work is ~2 hours within that window
      // Only block if windows overlap by 3+ hours (meaning likely scheduling conflict)
      let conflictingAppointment: any = null;
      const hasConflict = bookedAppointments.some(apt => {
        const aptStart = new Date(apt.start);
        const aptEnd = new Date(apt.end);
        
        // Calculate overlap in milliseconds
        const overlapStart = new Date(Math.max(slotStart.getTime(), aptStart.getTime()));
        const overlapEnd = new Date(Math.min(slotEnd.getTime(), aptEnd.getTime()));
        const overlapMs = Math.max(0, overlapEnd.getTime() - overlapStart.getTime());
        const overlapHours = overlapMs / (1000 * 60 * 60);
        
        // Only block if overlap is 3+ hours (e.g., 10-2 and 11-3 overlap by 2 hours = OK)
        // 10-2 vs 1-5 overlaps by 1 hour = OK
        // 1-5 vs 2-6 overlaps by 3 hours = BLOCK
        const isSignificantOverlap = overlapHours >= 3;
        
        if (isSignificantOverlap) {
          conflictingAppointment = apt;
        }
        
        return isSignificantOverlap;
      });
      
      // Check if slot is still available (1 hour lead time in Central Time)
      const now = new Date();
      const leadTimeMs = 1 * 60 * 60 * 1000; // 1 hour minimum lead time
      const minBookingTime = new Date(now.getTime() + leadTimeMs);
      
      const isSlotAvailable = !hasConflict && slotStart >= minBookingTime;
      
      // Debug logging for filtered slots
      if (!isSlotAvailable) {
        const slotDateStr = formatInTimeZone(slotStart, TIMEZONE, 'EEE MMM d, yyyy');
        const slotTimeStr = formatInTimeZone(slotStart, TIMEZONE, 'h:mm a');
        const endTimeStr = formatInTimeZone(slotEnd, TIMEZONE, 'h:mm a');
        const nowStr = formatInTimeZone(now, TIMEZONE, 'MMM d h:mm a zzz');
        const minBookStr = formatInTimeZone(minBookingTime, TIMEZONE, 'MMM d h:mm a zzz');
        
        if (hasConflict && conflictingAppointment) {
          const aptStartCT = formatInTimeZone(new Date(conflictingAppointment.start), TIMEZONE, 'h:mm a');
          const aptEndCT = formatInTimeZone(new Date(conflictingAppointment.end), TIMEZONE, 'h:mm a');
          console.log(`[Filter] ${slotDateStr} ${slotTimeStr}-${endTimeStr}: CONFLICT with appointment ${conflictingAppointment.id} (${aptStartCT}-${aptEndCT})`);
        } else {
          console.log(`[Filter] ${slotDateStr} ${slotTimeStr}-${endTimeStr}: TOO SOON (now: ${nowStr}, min: ${minBookStr})`);
        }
      }
      
      if (isSlotAvailable) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    });
    
    // Move to next day in Central Time
    currentDateCT = addDays(currentDateCT, 1);
  }
  
  return slots;
}
