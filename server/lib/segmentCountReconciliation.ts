/**
 * Segment Count Reconciliation Job
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 */

// Segment count reconciliation functionality has been temporarily disabled
// This file will be rebuilt when marketing features are re-implemented

export async function startCountReconciliationScheduler(): Promise<void> {
  // Disabled - will be rebuilt
}

export async function stopCountReconciliationScheduler(): Promise<void> {
  // Disabled - will be rebuilt
}

export function getCountReconciliationStatus(): any {
  // Disabled - will be rebuilt
  return {
    enabled: false,
    isRunning: false,
    lastReconciliationTime: null,
    lastReconciliationResult: null,
    nextReconciliationTime: null,
  };
}