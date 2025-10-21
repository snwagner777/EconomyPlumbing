import { refreshAllSegments } from './audienceManager';

/**
 * Segment Refresh Scheduler
 * 
 * Automatically refreshes all active customer segments every 12 hours.
 * This ensures:
 * - Customers automatically enter segments when they become eligible
 * - Customers automatically exit segments when they no longer qualify
 * - Win-back campaigns trigger for inactive customers
 * - VIP campaigns activate for high-value customers
 * - Segments stay fresh and campaigns remain effective
 * 
 * Schedule: Every 12 hours (configurable)
 */

const REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

let isRefreshing = false;
let lastRefreshTime: Date | null = null;
let lastRefreshResult: {
  totalSegments: number;
  totalEntered: number;
  totalExited: number;
  error?: string;
} | null = null;

/**
 * Main refresh function - processes all active segments
 */
async function performSegmentRefresh(): Promise<void> {
  if (isRefreshing) {
    console.log('[Segment Refresh] Skipping refresh - already running');
    return;
  }

  isRefreshing = true;
  const startTime = new Date();

  try {
    console.log('[Segment Refresh] Starting segment refresh...');
    
    const result = await refreshAllSegments();
    
    lastRefreshTime = new Date();
    lastRefreshResult = result;
    
    const duration = Date.now() - startTime.getTime();
    
    console.log(
      `[Segment Refresh] ✓ Completed successfully in ${Math.round(duration / 1000)}s: ` +
      `${result.totalSegments} segments processed, ` +
      `${result.totalEntered} customers entered, ` +
      `${result.totalExited} customers exited`
    );
  } catch (error) {
    const duration = Date.now() - startTime.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(
      `[Segment Refresh] ✗ Failed after ${Math.round(duration / 1000)}s:`,
      errorMessage
    );
    
    lastRefreshResult = {
      totalSegments: 0,
      totalEntered: 0,
      totalExited: 0,
      error: errorMessage,
    };
  } finally {
    isRefreshing = false;
  }
}

/**
 * Start the segment refresh scheduler
 * Runs immediately on startup, then every 12 hours
 */
export function startSegmentRefreshScheduler(): void {
  console.log('[Segment Refresh] Scheduler initialized - running every 12 hours');
  
  // Run initial refresh after 30 seconds (give server time to fully start)
  setTimeout(() => {
    console.log('[Segment Refresh] Running initial segment refresh...');
    performSegmentRefresh().catch(err => {
      console.error('[Segment Refresh] Initial refresh failed:', err);
    });
  }, 30000);
  
  // Schedule recurring refreshes every 12 hours
  setInterval(() => {
    console.log('[Segment Refresh] Running scheduled segment refresh...');
    performSegmentRefresh().catch(err => {
      console.error('[Segment Refresh] Scheduled refresh failed:', err);
    });
  }, REFRESH_INTERVAL);
}

/**
 * Get scheduler status (for monitoring/admin dashboard)
 */
export function getSegmentRefreshStatus(): {
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
  lastRefreshResult: typeof lastRefreshResult;
  nextRefreshTime: Date | null;
} {
  const nextRefreshTime = lastRefreshTime
    ? new Date(lastRefreshTime.getTime() + REFRESH_INTERVAL)
    : null;

  return {
    isRefreshing,
    lastRefreshTime,
    lastRefreshResult,
    nextRefreshTime,
  };
}

/**
 * Manually trigger a segment refresh (for admin use)
 */
export async function triggerManualSegmentRefresh(): Promise<typeof lastRefreshResult> {
  console.log('[Segment Refresh] Manual refresh triggered by admin');
  await performSegmentRefresh();
  return lastRefreshResult;
}
