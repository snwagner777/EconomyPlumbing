/**
 * Scheduler Options API
 * 
 * Returns available job types from ServiceTitan for the scheduler UI.
 * This endpoint is called when the scheduler modal opens to populate service options.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';

export async function GET(req: NextRequest) {
  try {
    // Fetch job types from ServiceTitan (cached for performance)
    const jobTypes = await serviceTitanSettings.getJobTypes();
    
    // Format for UI (already filtered to active in getJobTypes)
    const options = jobTypes
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
