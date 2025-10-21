import { db } from '../db';
import { customerSegments, segmentMembership } from '@shared/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

/**
 * Segment Count Reconciliation Job
 * 
 * Periodically recounts actual segment members and updates cached memberCount.
 * This catches any drift caused by:
 * - Failed transactions that partially completed
 * - Direct database modifications
 * - Race conditions (though transactions should prevent these)
 * - Manual data fixes
 * 
 * Schedule: Every 24 hours (configurable)
 */

const RECONCILIATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

let isReconciling = false;
let lastReconciliationTime: Date | null = null;
let lastReconciliationResult: {
  totalSegments: number;
  segmentsWithDrift: number;
  totalDrift: number;
  maxDrift: number;
  error?: string;
} | null = null;

interface SegmentCountDrift {
  segmentId: string;
  segmentName: string;
  cachedCount: number;
  actualCount: number;
  drift: number;
}

/**
 * Reconcile counts for all segments
 */
async function performCountReconciliation(): Promise<void> {
  if (isReconciling) {
    console.log('[Count Reconciliation] Skipping - already running');
    return;
  }

  isReconciling = true;
  const startTime = new Date();

  try {
    console.log('[Count Reconciliation] Starting segment count reconciliation...');

    // Get all segments
    const allSegments = await db.select().from(customerSegments);

    let segmentsWithDrift = 0;
    let totalDrift = 0;
    let maxDrift = 0;
    const driftDetails: SegmentCountDrift[] = [];

    // Check each segment
    for (const segment of allSegments) {
      // Count actual active members
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(segmentMembership)
        .where(
          and(
            eq(segmentMembership.segmentId, segment.id),
            isNull(segmentMembership.exitedAt)
          )
        );

      const actualCount = result[0]?.count || 0;
      const cachedCount = segment.memberCount || 0;
      const drift = Math.abs(actualCount - cachedCount);

      // If there's drift, update the count
      if (drift > 0) {
        segmentsWithDrift++;
        totalDrift += drift;
        maxDrift = Math.max(maxDrift, drift);

        driftDetails.push({
          segmentId: segment.id,
          segmentName: segment.name,
          cachedCount,
          actualCount,
          drift,
        });

        // Update the cached count
        await db
          .update(customerSegments)
          .set({
            memberCount: actualCount,
            updatedAt: new Date(),
          })
          .where(eq(customerSegments.id, segment.id));

        console.log(
          `[Count Reconciliation] ⚠️ Drift detected in segment "${segment.name}" (${segment.id}): ` +
          `cached=${cachedCount}, actual=${actualCount}, drift=${drift}`
        );
      }
    }

    lastReconciliationTime = new Date();
    lastReconciliationResult = {
      totalSegments: allSegments.length,
      segmentsWithDrift,
      totalDrift,
      maxDrift,
    };

    const duration = Date.now() - startTime.getTime();

    if (segmentsWithDrift > 0) {
      console.log(
        `[Count Reconciliation] ✓ Completed in ${Math.round(duration / 1000)}s: ` +
        `${allSegments.length} segments checked, ` +
        `${segmentsWithDrift} had drift (total drift: ${totalDrift}, max: ${maxDrift})`
      );
      
      // Log details for segments with significant drift (>10 or >10%)
      driftDetails
        .filter(d => d.drift > 10 || (d.cachedCount > 0 && d.drift / d.cachedCount > 0.1))
        .forEach(d => {
          console.warn(
            `[Count Reconciliation] Significant drift: ${d.segmentName} - ` +
            `${d.cachedCount} → ${d.actualCount} (${d.drift} difference)`
          );
        });
    } else {
      console.log(
        `[Count Reconciliation] ✓ Completed in ${Math.round(duration / 1000)}s: ` +
        `${allSegments.length} segments checked, all counts accurate`
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(
      `[Count Reconciliation] ✗ Failed after ${Math.round(duration / 1000)}s:`,
      errorMessage
    );

    lastReconciliationResult = {
      totalSegments: 0,
      segmentsWithDrift: 0,
      totalDrift: 0,
      maxDrift: 0,
      error: errorMessage,
    };
  } finally {
    isReconciling = false;
  }
}

/**
 * Start the count reconciliation scheduler
 * Runs after 1 hour on startup, then every 24 hours
 */
export function startCountReconciliationScheduler(): void {
  console.log('[Count Reconciliation] Scheduler initialized - running every 24 hours');

  // Run initial reconciliation after 1 hour (give system time to stabilize)
  setTimeout(() => {
    console.log('[Count Reconciliation] Running initial count reconciliation...');
    performCountReconciliation().catch(err => {
      console.error('[Count Reconciliation] Initial reconciliation failed:', err);
    });
  }, 60 * 60 * 1000); // 1 hour

  // Schedule recurring reconciliations every 24 hours
  setInterval(() => {
    console.log('[Count Reconciliation] Running scheduled count reconciliation...');
    performCountReconciliation().catch(err => {
      console.error('[Count Reconciliation] Scheduled reconciliation failed:', err);
    });
  }, RECONCILIATION_INTERVAL);
}

/**
 * Get reconciliation status (for monitoring/admin dashboard)
 */
export function getCountReconciliationStatus(): {
  isReconciling: boolean;
  lastReconciliationTime: Date | null;
  lastReconciliationResult: typeof lastReconciliationResult;
  nextReconciliationTime: Date | null;
} {
  const nextReconciliationTime = lastReconciliationTime
    ? new Date(lastReconciliationTime.getTime() + RECONCILIATION_INTERVAL)
    : null;

  return {
    isReconciling,
    lastReconciliationTime,
    lastReconciliationResult,
    nextReconciliationTime,
  };
}

/**
 * Manually trigger count reconciliation (for admin use)
 */
export async function triggerManualCountReconciliation(): Promise<typeof lastReconciliationResult> {
  console.log('[Count Reconciliation] Manual reconciliation triggered by admin');
  await performCountReconciliation();
  return lastReconciliationResult;
}
