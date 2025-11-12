/**
 * Cron Endpoint: Membership Sync
 * 
 * Syncs VIP membership data from ServiceTitan.
 * Schedule: Every 5 minutes (was 30s polling, now event-driven fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { startMembershipSyncJob } from '@/server/lib/membershipSyncJob';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Membership Sync: Starting...');
    await startMembershipSyncJob();
    console.log('[Cron] Membership Sync: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Membership sync completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Membership Sync: Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync memberships', details: error.message },
      { status: 500 }
    );
  }
}
