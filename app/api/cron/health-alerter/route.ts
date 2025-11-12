/**
 * Cron Endpoint: Health Monitoring & Alerting
 * 
 * Monitors system health and sends alerts if issues detected.
 * Schedule: Every 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { initHealthAlerterScheduler } from '@/server/lib/healthAlerterScheduler';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Health Alerter: Starting...');
    await initHealthAlerterScheduler();
    console.log('[Cron] Health Alerter: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Health check completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Health Alerter: Error:', error);
    return NextResponse.json(
      { error: 'Failed to run health check', details: error.message },
      { status: 500 }
    );
  }
}
