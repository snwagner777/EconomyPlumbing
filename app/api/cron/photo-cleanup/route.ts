/**
 * Cron Endpoint: Photo Cleanup (Combined)
 * 
 * Runs both daily photo cleanup jobs at 3:00 AM.
 * Combines: photo-cleanup + automated-photo-cleanup
 * Schedule: Daily at 3:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { startPhotoCleanupJob } from '@/server/lib/photoCleanupJob';
import { startAutomatedPhotoCleanup } from '@/server/lib/automatedPhotoCleanup';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Photo Cleanup: Starting...');
    
    // Run both cleanup jobs
    await startPhotoCleanupJob();
    await startAutomatedPhotoCleanup();
    
    console.log('[Cron] Photo Cleanup: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Photo cleanup completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Photo Cleanup: Error:', error);
    return NextResponse.json(
      { error: 'Failed to run photo cleanup', details: error.message },
      { status: 500 }
    );
  }
}
