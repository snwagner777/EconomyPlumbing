/**
 * Smart Scheduler Availability API
 * 
 * Intelligently suggests appointment slots based on:
 * - Customer location (address/zip)
 * - Existing jobs scheduled for that day
 * - Proximity scoring to minimize driving distance
 * - Zone clustering for fuel efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';

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
    
    // Get business unit
    const businessUnits = await serviceTitanSettings.getBusinessUnits();
    const plumbingBU = businessUnits.find(bu => bu.name.toLowerCase().includes('plumbing'));
    
    if (!plumbingBU) {
      return NextResponse.json(
        {
          success: false,
          error: 'No plumbing business unit found',
        },
        { status: 500 }
      );
    }
    
    // Fetch available slots from ServiceTitan
    const availability = await serviceTitanSettings.checkAvailability({
      businessUnitId: plumbingBU.id,
      jobTypeId,
      startDate: start,
      endDate: end,
    });
    
    // Fetch existing scheduled jobs for the date range
    const existingJobs = await serviceTitanJobs.getJobsForDateRange(start, end);
    
    // Extract customer zone (ZIP prefix for clustering)
    const customerZone = customerZip ? getZone(customerZip) : null;
    
    // Score each availability slot based on proximity to existing jobs
    const scoredSlots: ScoredSlot[] = availability
      .filter(slot => slot.isAvailable)
      .map((slot, index) => {
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
        // Higher score = more fuel efficient (more nearby jobs)
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
