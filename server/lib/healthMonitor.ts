/**
 * Health Monitoring Service
 * 
 * Tracks the health status of all critical background jobs and services.
 * Records successful/failed runs, calculates health status, and provides system-wide health reporting.
 * 
 * Health Status Levels:
 * - healthy: Operating normally
 * - degraded: Some issues but still operational
 * - unhealthy: Experiencing problems that need attention
 * - critical: Severe issues requiring immediate action
 */

import { db } from "../db";
import { systemHealthChecks } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { resetHealthAlertIfHealthy } from "./healthAlerter";

/**
 * Health status thresholds
 */
const HEALTH_THRESHOLDS = {
  DEGRADED_FAILURES: 2,     // 2+ consecutive failures = degraded
  UNHEALTHY_FAILURES: 5,    // 5+ consecutive failures = unhealthy
  CRITICAL_FAILURES: 10,    // 10+ consecutive failures = critical
  STALE_THRESHOLD_HOURS: 48, // No run in 48 hours = degraded (for schedulers)
};

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'critical';
export type ServiceType = 'scheduler' | 'sync' | 'processor' | 'monitor';

interface RecordRunOptions {
  serviceName: string;
  serviceType: ServiceType;
  success: boolean;
  statusMessage?: string;
  executionTimeMs?: number;
  recordsProcessed?: number;
  errorDetails?: string;
}

/**
 * Calculate health status based on consecutive failures and other metrics
 */
function calculateHealthStatus(
  consecutiveFailures: number,
  lastSuccessfulRunAt: Date | null,
  lastFailedRunAt: Date | null
): { status: HealthStatus; message: string } {
  // Critical: Many consecutive failures
  if (consecutiveFailures >= HEALTH_THRESHOLDS.CRITICAL_FAILURES) {
    return {
      status: 'critical',
      message: `Critical: ${consecutiveFailures} consecutive failures - immediate action required`
    };
  }

  // Unhealthy: Multiple consecutive failures
  if (consecutiveFailures >= HEALTH_THRESHOLDS.UNHEALTHY_FAILURES) {
    return {
      status: 'unhealthy',
      message: `Unhealthy: ${consecutiveFailures} consecutive failures - needs attention`
    };
  }

  // Degraded: Some failures
  if (consecutiveFailures >= HEALTH_THRESHOLDS.DEGRADED_FAILURES) {
    return {
      status: 'degraded',
      message: `Degraded: ${consecutiveFailures} consecutive failures`
    };
  }

  // Check for stale service (no successful run in 48 hours)
  if (lastSuccessfulRunAt) {
    const hoursSinceLastSuccess = (Date.now() - lastSuccessfulRunAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSuccess > HEALTH_THRESHOLDS.STALE_THRESHOLD_HOURS) {
      return {
        status: 'degraded',
        message: `Degraded: No successful run in ${Math.round(hoursSinceLastSuccess)} hours`
      };
    }
  }

  // Healthy: No issues
  return {
    status: 'healthy',
    message: 'Operating normally'
  };
}

/**
 * Record a service run (success or failure)
 */
export async function recordServiceRun(options: RecordRunOptions): Promise<void> {
  const {
    serviceName,
    serviceType,
    success,
    statusMessage,
    executionTimeMs,
    recordsProcessed,
    errorDetails
  } = options;

  try {
    // Get existing health record
    const [existing] = await db
      .select()
      .from(systemHealthChecks)
      .where(
        and(
          eq(systemHealthChecks.serviceName, serviceName),
          eq(systemHealthChecks.serviceType, serviceType)
        )
      )
      .limit(1);

    const now = new Date();

    if (existing) {
      // Update existing record
      const consecutiveFailures = success ? 0 : (existing.consecutiveFailures + 1);
      const totalRuns = existing.totalRuns + 1;
      const totalFailures = success ? existing.totalFailures : (existing.totalFailures + 1);

      // Calculate new health status
      const { status, message } = calculateHealthStatus(
        consecutiveFailures,
        success ? now : existing.lastSuccessfulRunAt,
        success ? existing.lastFailedRunAt : now
      );

      // Calculate average duration if provided
      const lastDurationMs = executionTimeMs || existing.lastDurationMs;
      const avgDurationMs = executionTimeMs && existing.avgDurationMs
        ? Math.round((existing.avgDurationMs * (totalRuns - 1) + executionTimeMs) / totalRuns)
        : existing.avgDurationMs;

      await db
        .update(systemHealthChecks)
        .set({
          status,
          statusMessage: statusMessage || message,
          lastSuccessfulRunAt: success ? now : existing.lastSuccessfulRunAt,
          lastFailedRunAt: success ? existing.lastFailedRunAt : now,
          consecutiveFailures,
          totalRuns,
          totalFailures,
          lastDurationMs,
          avgDurationMs,
          lastError: success ? null : (errorDetails || statusMessage),
          lastErrorAt: success ? existing.lastErrorAt : now,
          lastCheckedAt: now,
        })
        .where(eq(systemHealthChecks.id, existing.id));

      console.log(
        `[HealthMonitor] Updated ${serviceName}: ${status} (${consecutiveFailures} consecutive failures)`
      );

      // Reset alert status if service has recovered to healthy
      if (status === 'healthy' && existing.alertSent) {
        await resetHealthAlertIfHealthy(serviceName, serviceType);
      }
    } else {
      // Create new record
      const { status, message } = calculateHealthStatus(
        success ? 0 : 1,
        success ? now : null,
        success ? null : now
      );

      await db.insert(systemHealthChecks).values({
        serviceName,
        serviceType,
        status,
        statusMessage: statusMessage || message,
        lastSuccessfulRunAt: success ? now : null,
        lastFailedRunAt: success ? null : now,
        consecutiveFailures: success ? 0 : 1,
        totalRuns: 1,
        totalFailures: success ? 0 : 1,
        lastDurationMs: executionTimeMs || null,
        avgDurationMs: executionTimeMs || null,
        lastError: success ? null : (errorDetails || statusMessage),
        lastErrorAt: success ? null : now,
        lastCheckedAt: now,
      });

      console.log(`[HealthMonitor] Created health record for ${serviceName}: ${status}`);
    }
  } catch (error) {
    console.error(`[HealthMonitor] Error recording run for ${serviceName}:`, error);
    // Don't throw - health monitoring should never break the actual service
  }
}

/**
 * Record a successful service run
 */
export async function recordSuccess(
  serviceName: string,
  serviceType: ServiceType,
  options?: {
    statusMessage?: string;
    executionTimeMs?: number;
    recordsProcessed?: number;
  }
): Promise<void> {
  await recordServiceRun({
    serviceName,
    serviceType,
    success: true,
    ...options
  });
}

/**
 * Record a failed service run
 */
export async function recordFailure(
  serviceName: string,
  serviceType: ServiceType,
  error: Error | string,
  options?: {
    statusMessage?: string;
    executionTimeMs?: number;
  }
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorDetails = error instanceof Error ? error.stack : undefined;

  await recordServiceRun({
    serviceName,
    serviceType,
    success: false,
    statusMessage: options?.statusMessage,
    errorDetails: errorDetails || errorMessage,
    executionTimeMs: options?.executionTimeMs
  });
}

/**
 * Get health status for a specific service
 */
export async function getServiceHealth(
  serviceName: string,
  serviceType: ServiceType
) {
  const [health] = await db
    .select()
    .from(systemHealthChecks)
    .where(
      and(
        eq(systemHealthChecks.serviceName, serviceName),
        eq(systemHealthChecks.serviceType, serviceType)
      )
    )
    .limit(1);

  return health || null;
}

/**
 * Get health status for all services
 */
export async function getAllServiceHealth() {
  const health = await db
    .select()
    .from(systemHealthChecks)
    .orderBy(desc(systemHealthChecks.lastCheckedAt));

  return health;
}

/**
 * Get overall system health status
 */
export async function getSystemHealth(): Promise<{
  overallStatus: HealthStatus;
  criticalServices: number;
  unhealthyServices: number;
  degradedServices: number;
  healthyServices: number;
  totalServices: number;
}> {
  const allHealth = await getAllServiceHealth();

  const counts = {
    critical: 0,
    unhealthy: 0,
    degraded: 0,
    healthy: 0
  };

  for (const service of allHealth) {
    counts[service.status as HealthStatus]++;
  }

  // Determine overall system status
  let overallStatus: HealthStatus = 'healthy';
  if (counts.critical > 0) {
    overallStatus = 'critical';
  } else if (counts.unhealthy > 0) {
    overallStatus = 'unhealthy';
  } else if (counts.degraded > 0) {
    overallStatus = 'degraded';
  }

  return {
    overallStatus,
    criticalServices: counts.critical,
    unhealthyServices: counts.unhealthy,
    degradedServices: counts.degraded,
    healthyServices: counts.healthy,
    totalServices: allHealth.length
  };
}
