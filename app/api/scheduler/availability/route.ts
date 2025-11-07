/**
 * Scheduler Availability API
 * 
 * @deprecated Use /api/scheduler/smart-availability instead for proximity-optimized scheduling
 * 
 * Returns available appointment time slots from ServiceTitan for a specific job type and date range.
 * Now uses Capacity API (accounts for non-job appointments like lunch breaks, meetings, PTO).
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobTypeId = searchParams.get('jobTypeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!jobTypeId || !startDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: jobTypeId and startDate',
        },
        { status: 400 }
      );
    }
    
    // Default to 7 days if no end date provided
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get business unit (using "Plumbing" as default)
    const businessUnits = await serviceTitanSettings.getBusinessUnits();
    const plumbingBU = businessUnits.find(bu => bu.name.toLowerCase().includes('plumbing'));
    
    if (!plumbingBU) {
      return NextResponse.json(
        {
          success: false,
          error: 'No plumbing business unit found in ServiceTitan',
        },
        { status: 500 }
      );
    }
    
    // Fetch availability from ServiceTitan Capacity API
    // This correctly accounts for regular appointments AND non-job appointments (lunch, meetings, PTO)
    const availability = await serviceTitanSettings.checkCapacity({
      businessUnitId: plumbingBU.id,
      jobTypeId: parseInt(jobTypeId),
      startDate: start,
      endDate: end,
      skillBasedAvailability: true,
    });
    
    // Normalize time windows into scheduler-friendly format
    const slots = availability
      .filter(window => window.isAvailable)
      .map((window, index) => ({
        id: `slot-${index}`, // Generate ID since API doesn't provide one
        start: window.start,
        end: window.end,
        date: window.start.split('T')[0], // Extract date for grouping
        timeLabel: formatTimeWindow(window.start, window.end),
        period: getTimePeriod(window.start), // morning, afternoon, evening
        technicianIds: window.technicianIds || [],
      }));
    
    // Group by date for easier calendar rendering
    const slotsByDate = slots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, typeof slots>);
    
    return NextResponse.json({
      success: true,
      availability: slots,
      slotsByDate,
    });
  } catch (error: any) {
    console.error('[Scheduler Availability API] Error fetching availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch availability',
        details: error.message,
      },
      { status: 500 }
    );
  }
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
