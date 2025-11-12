/**
 * Cron Endpoint: Auto Blog Generation
 * 
 * Generates new blog posts using AI.
 * Schedule: Weekly on Mondays at 9:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { startAutoBlogGeneration } from '@/server/lib/autoBlogGenerator';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Auto Blog: Starting...');
    // Type assertion: storage implements the methods used by autoBlogGenerator
    await startAutoBlogGeneration(storage as any);
    console.log('[Cron] Auto Blog: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Auto blog generation completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Auto Blog: Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog posts', details: error.message },
      { status: 500 }
    );
  }
}
