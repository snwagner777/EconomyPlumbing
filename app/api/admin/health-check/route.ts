/**
 * Manual Health Check API
 * 
 * Allows admins to manually trigger system health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { runHealthCheck } from '@/server/lib/healthAlerter';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    console.log('[Admin Health Check] Running manual health check...');
    
    // Run health checks
    const checks = await runHealthCheck();
    
    // Determine overall health status
    const failedChecks = checks.filter(
      check => check.status === 'down' || check.status === 'degraded'
    );
    const hasFailures = failedChecks.length > 0;
    
    console.log('[Admin Health Check] Completed:', checks.length, 'checks,', failedChecks.length, 'failures');
    
    return NextResponse.json({
      success: !hasFailures,
      healthy: !hasFailures,
      checks,
      failedChecks: failedChecks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Admin Health Check] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run health check', details: error.message },
      { status: 500 }
    );
  }
}
