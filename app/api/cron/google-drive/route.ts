/**
 * Cron Endpoint: Google Drive Monitoring
 * 
 * Monitors Google Drive for new photos and syncs to database.
 * Schedule: Every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { startGoogleDriveMonitoring } from '@/server/lib/googleDriveMonitor';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Google Drive: Starting...');
    await startGoogleDriveMonitoring();
    console.log('[Cron] Google Drive: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Google Drive monitoring completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Google Drive: Error:', error);
    return NextResponse.json(
      { error: 'Failed to monitor Google Drive', details: error.message },
      { status: 500 }
    );
  }
}
