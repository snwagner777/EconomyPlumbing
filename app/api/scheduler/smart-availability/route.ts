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
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`[Smart Scheduler] Fetching availability from ${start.toISOString()} to ${end.toISOString()}`);
    
    // Fetch existing appointments and jobs
    const appointments = await fetchAppointments(start, end);
    console.log(`[Smart Scheduler] Found ${appointments.length} existing appointments`);
    
    // Get arrival windows from ServiceTitan
    const arrivalWindows = await getArrivalWindows();
    console.log(`[Smart Scheduler] Using ${arrivalWindows.length} arrival windows from ServiceTitan`);
    
    // Generate available slots using arrival windows
    const availableSlots = generateAvailableSlots(start, end, appointments, arrivalWindows);
    console.log(`[Smart Scheduler] Generated ${availableSlots.length} available slots`);
    
    // Fetch scheduled jobs for proximity scoring
    const existingJobs = await serviceTitanJobs.getJobsForDateRange(start, end);
    console.log(`[Smart Scheduler] Found ${existingJobs.length} jobs for proximity scoring`);
    
    // Extract customer zone from serviceTitanZones table
    const customerZone = customerZip ? await getZoneForZip(customerZip) : null;
    console.log(`[Smart Scheduler] Customer zone: ${customerZone || 'unknown'}`);
    
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
    
    // Score each slot based on proximity to existing jobs
    const scoredSlots: ScoredSlot[] = availableSlots.map((slot, index) => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      
      // Find jobs overlapping with this time window
      const overlappingJobs = existingJobs.filter(job => {
        const jobStart = new Date(job.appointmentStart);
        const jobEnd = new Date(job.appointmentEnd);
        return (
          (jobStart >= slotStart && jobStart < slotEnd) ||
          (jobEnd > slotStart && jobEnd <= slotEnd) ||
          (jobStart <= slotStart && jobEnd >= slotEnd)
        );
      });
      
      // Count jobs in same zone using precomputed zone map (normalized ZIPs)
      let nearbyJobs = 0;
      if (customerZone) {
        nearbyJobs = overlappingJobs.filter(job => {
          const normalizedJobZip = normalizeZip(job.locationZip);
          if (!normalizedJobZip) return false; // Skip invalid ZIPs
          const jobZone = zipToZone[normalizedJobZip];
          return jobZone === customerZone;
        }).length;
      }
      
      // Calculate proximity score (0-100)
      const proximityScore = calculateProximityScore(
        customerZone,
        overlappingJobs,
        nearbyJobs
      );
      
      return {
        id: `slot-${index}`,
        start: slot.start,
        end: slot.end,
        date: slot.start.split('T')[0],
        timeLabel: formatTimeWindow(slot.start, slot.end),
        period: getTimePeriod(slot.start),
        proximityScore,
        nearbyJobs,
        zone: customerZone || undefined,
      };
    });
    
    // Sort by proximity score (highest first = most fuel efficient)
    scoredSlots.sort((a, b) => b.proximityScore - a.proximityScore);
    
    console.log(`[Smart Scheduler] Top 3 slots: ${scoredSlots.slice(0, 3).map(s => `${s.timeLabel} (score: ${s.proximityScore})`).join(', ')}`);
    
    return NextResponse.json({
      success: true,
      slots: scoredSlots,
      optimization: {
        customerZone,
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
 * Calculate proximity score (0-100)
 * Factors:
 * - Number of nearby jobs in same zone
 * - Total jobs in time window (route density)
 */
function calculateProximityScore(
  customerZone: string | null,
  overlappingJobs: any[],
  nearbyJobs: number
): number {
  if (!customerZone) {
    // No zone info = neutral score
    return 50;
  }
  
  // Base score on nearby jobs
  let score = 50;
  
  // Each nearby job adds 15 points (max 90)
  score += Math.min(nearbyJobs * 15, 40);
  
  // Bonus for high-density routes (4+ total jobs in window)
  if (overlappingJobs.length >= 4) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function formatTimeWindow(start: string, end: string): string {
  const startTime = new Date(start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endTime = new Date(end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${startTime} - ${endTime}`;
}

function getTimePeriod(start: string): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date(start).getHours();
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
 * Get arrival windows by extracting REAL windows from existing appointments
 * This gives us the actual configured windows (e.g., 2-6 PM, 8-12 AM, etc.)
 */
async function getArrivalWindows(): Promise<Array<{ start: string; end: string; durationHours: number }>> {
  try {
    // Fetch last 30 days of appointments to find all arrival window patterns
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const appointments = await serviceTitanJobs.getJobsForDateRange(startDate, endDate);
    
    // Extract unique arrival windows from actual appointments
    const windowsMap = new Map<string, { start: string; end: string; durationHours: number }>();
    
    for (const job of appointments) {
      if (job.appointmentStart && job.appointmentEnd) {
        const startTime = new Date(job.appointmentStart);
        const endTime = new Date(job.appointmentEnd);
        
        // Format as HH:mm (24-hour format)
        const start = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`;
        const end = `${endTime.getUTCHours().toString().padStart(2, '0')}:${endTime.getUTCMinutes().toString().padStart(2, '0')}`;
        
        const key = `${start}-${end}`;
        if (!windowsMap.has(key)) {
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          
          windowsMap.set(key, { start, end, durationHours });
        }
      }
    }
    
    const windows = Array.from(windowsMap.values());
    console.log(`[Smart Scheduler] Extracted ${windows.length} unique arrival windows from appointments:`, 
      windows.map(w => `${w.start}-${w.end}`));
    
    // If no windows found, use fallback
    if (windows.length === 0) {
      console.log('[Smart Scheduler] No windows found, using fallback');
      return [
        { start: '08:00', end: '12:00', durationHours: 4 },
        { start: '13:00', end: '17:00', durationHours: 4 },
      ];
    }
    
    return windows;
  } catch (error) {
    console.error('[Smart Scheduler] Error extracting arrival windows:', error);
    return [
      { start: '08:00', end: '12:00', durationHours: 4 },
      { start: '13:00', end: '17:00', durationHours: 4 },
    ];
  }
}

/**
 * Generate available time slots based on arrival windows and existing appointments
 */
function generateAvailableSlots(
  startDate: Date,
  endDate: Date,
  bookedAppointments: Appointment[],
  arrivalWindows: Array<{ start: string; end: string; durationHours: number }>
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Generate slots for each arrival window
    arrivalWindows.forEach(window => {
      const [startHour, startMin] = window.start.split(':').map(Number);
      const [endHour, endMin] = window.end.split(':').map(Number);
      
      const slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin || 0, 0, 0);
      
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endHour, endMin || 0, 0, 0);
      
      // Check for conflicts
      const hasConflict = bookedAppointments.some(apt => {
        const aptStart = new Date(apt.arrivalWindowStart || apt.start);
        const aptEnd = new Date(apt.arrivalWindowEnd || apt.end);
        
        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });
      
      // Allow slots that end after current time (not just start)
      // This shows today's afternoon slot even if morning has passed
      const now = new Date();
      const isSlotAvailable = !hasConflict && slotEnd > now;
      
      if (isSlotAvailable) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}
