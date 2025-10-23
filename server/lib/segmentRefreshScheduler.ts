/**
 * Segment Refresh Scheduler
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 */

// Segment refresh functionality has been temporarily disabled
// This file will be rebuilt when marketing features are re-implemented

export async function startSegmentRefreshScheduler(): Promise<void> {
  // Disabled - will be rebuilt
}

export async function stopSegmentRefreshScheduler(): Promise<void> {
  // Disabled - will be rebuilt
}

export function getSegmentRefreshStatus(): any {
  // Disabled - will be rebuilt
  return {
    enabled: false,
    isRunning: false,
    lastRefreshTime: null,
    lastRefreshResult: null,
    nextRefreshTime: null,
  };
}