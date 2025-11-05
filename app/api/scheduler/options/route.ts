/**
 * Scheduler Options API
 * 
 * Returns available job types from ServiceTitan for the scheduler UI.
 * This endpoint is called when the scheduler modal opens to populate service options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';

// Job types to exclude from customer-facing scheduler
const EXCLUDED_JOB_TYPES = [
  'Estimate',
  'Finish Up Job',
  'Major - 4 Hours',
  'Major - 8 Hours',
];

export async function GET(req: NextRequest) {
  try {
    // Fetch job types from ServiceTitan (cached for performance)
    const jobTypes = await serviceTitanSettings.getJobTypes();
    
    // Filter out internal/unwanted job types
    const filtered = jobTypes.filter(jt => !EXCLUDED_JOB_TYPES.includes(jt.name));
    
    // Format for UI
    const options = filtered
      .map(jt => ({
        id: jt.id,
        name: jt.name,
        code: jt.code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({
      success: true,
      jobTypes: options,
    });
  } catch (error: any) {
    console.error('[Scheduler Options API] Error fetching job types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch service options',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
