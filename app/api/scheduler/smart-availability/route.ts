/**
 * Smart Scheduler Availability API
 * 
 * Intelligently suggests appointment slots based on:
 * - Customer location (address/zip)
 * - Existing jobs scheduled for that day
 * - Proximity scoring to minimize driving distance
 * - Zone clustering for fuel efficiency
 * 
 * Uses actual appointment data instead of capacity API
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';

interface SmartAvailabilityRequest {
  jobTypeId: number;
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
const SLOT_DURATION_HOURS = 2; // 2-hour appointment windows

export async function POST(req: NextRequest) {
  try {
    const body: SmartAvailabilityRequest = await req.json();
    const { jobTypeId, customerZip, customerAddress, startDate, endDate } = body;
    
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
    
    // Fetch existing appointments for the date range
    const appointments = await fetchAppointments(start, end);
    console.log(`[Smart Scheduler] Found ${appointments.length} existing appointments`);
    
    // Fetch scheduled jobs for proximity scoring
    const existingJobs = await serviceTitanJobs.getJobsForDateRange(start, end);
    console.log(`[Smart Scheduler] Found ${existingJobs.length} jobs for proximity scoring`);
    
    // Extract customer zone (ZIP prefix for clustering)
    const customerZone = customerZip ? getZone(customerZip) : null;
    
    // Generate available time slots by finding gaps
    const availableSlots = generateAvailableSlots(start, end, appointments);
    console.log(`[Smart Scheduler] Generated ${availableSlots.length} available slots`);
    
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
      
      // Count jobs in same zone
      let nearbyJobs = 0;
      if (customerZone) {
        nearbyJobs = overlappingJobs.filter(job => {
          const jobZone = job.locationZip ? getZone(job.locationZip) : null;
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
 * Generate available time slots based on business hours and existing appointments
 */
function generateAvailableSlots(
  startDate: Date,
  endDate: Date,
  bookedAppointments: Appointment[]
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  const currentDate = new Date(startDate);
  
  // Generate slots for each day in the range
  while (currentDate <= endDate) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Generate time slots for this day
    for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour += SLOT_DURATION_HOURS) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + SLOT_DURATION_HOURS, 0, 0, 0);
      
      // Check if this slot conflicts with any booked appointments
      const hasConflict = bookedAppointments.some(apt => {
        const aptStart = new Date(apt.arrivalWindowStart || apt.start);
        const aptEnd = new Date(apt.arrivalWindowEnd || apt.end);
        
        // Check for overlap
        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });
      
      if (!hasConflict) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}

/**
 * Extract zone from ZIP code (first 3 digits)
 * Austin zones: 787xx, 786xx, 785xx
 */
function getZone(zip: string): string {
  const cleaned = zip.replace(/\D/g, '');
  return cleaned.substring(0, 3);
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
