/**
 * Health Alerter Scheduler
 * 
 * Periodically checks system health and sends email alerts for critical failures.
 * Runs every 5 minutes to ensure timely notification of system issues.
 */

import { checkAndSendHealthAlerts } from "./healthAlerter";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let scheduler: NodeJS.Timeout | null = null;

/**
 * Run the health alerter check
 */
async function runHealthAlerterCheck(): Promise<void> {
  console.log('[HealthAlerterScheduler] Running health check and alert scan...');
  
  try {
    const startTime = Date.now();
    const result = await checkAndSendHealthAlerts();
    const duration = Date.now() - startTime;

    if (result.errors.length > 0) {
      console.error(
        `[HealthAlerterScheduler] Check completed with ${result.errors.length} error(s) in ${duration}ms:`,
        result.errors
      );
    } else {
      console.log(
        `[HealthAlerterScheduler] Check completed: ${result.alertsSent} alert(s) sent in ${duration}ms`
      );
    }
  } catch (error) {
    console.error('[HealthAlerterScheduler] Error during health alert check:', error);
  }
}

/**
 * Initialize the health alerter scheduler
 */
export function initHealthAlerterScheduler(): void {
  if (scheduler) {
    console.log('[HealthAlerterScheduler] Scheduler already running');
    return;
  }

  console.log('[HealthAlerterScheduler] Starting scheduler (runs every 5 minutes)...');
  
  // Run immediately on startup
  runHealthAlerterCheck();

  // Then run every 5 minutes
  scheduler = setInterval(runHealthAlerterCheck, CHECK_INTERVAL_MS);

  console.log('[HealthAlerterScheduler] Scheduler initialized successfully');
}

/**
 * Stop the scheduler (useful for testing or shutdown)
 */
export function stopHealthAlerterScheduler(): void {
  if (scheduler) {
    clearInterval(scheduler);
    scheduler = null;
    console.log('[HealthAlerterScheduler] Scheduler stopped');
  }
}
