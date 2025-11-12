/**
 * Cron Endpoint: GMB Automation (Combined)
 * 
 * Combines GMB review fetching and auto-reply.
 * Schedule: Every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { autoFetchGMBReviews } from '@/server/lib/gmbAutomation';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] GMB Automation: Starting...');
    await autoFetchGMBReviews();
    console.log('[Cron] GMB Automation: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'GMB automation completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] GMB Automation: Error:', error);
    return NextResponse.json(
      { error: 'Failed to run GMB automation', details: error.message },
      { status: 500 }
    );
  }
}
