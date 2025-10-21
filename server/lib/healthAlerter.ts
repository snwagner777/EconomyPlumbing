/**
 * Health Alerting Service
 * 
 * Monitors system health and sends email alerts to admins when services
 * reach unhealthy or critical status. Prevents alert spam by tracking
 * which alerts have been sent.
 */

import { db } from "../db";
import { systemHealthChecks } from "@shared/schema";
import { eq, or, and, isNull } from "drizzle-orm";
import { render } from "@react-email/components";
import { Resend } from "resend";
import SystemHealthAlertEmail from "../emails/system-health-alert";

// Lazy-initialize Resend client
let resend: Resend | null = null;
function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Admin email addresses that should receive health alerts
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL || "admin@economyplumbing.com",
];

// Alert thresholds - only send alerts for these statuses
const ALERTABLE_STATUSES = ['unhealthy', 'critical'];

/**
 * Check all service health records and send alerts if needed
 */
export async function checkAndSendHealthAlerts(): Promise<{
  alertsSent: number;
  errors: string[];
}> {
  console.log('[HealthAlerter] Checking for services that need alerts...');
  
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('[HealthAlerter] RESEND_API_KEY not configured - skipping email alerts');
    return {
      alertsSent: 0,
      errors: ['RESEND_API_KEY not configured'],
    };
  }
  
  const results = {
    alertsSent: 0,
    errors: [] as string[],
  };

  try {
    // Get all unhealthy/critical services that haven't been alerted yet
    const unhealthyServices = await db
      .select()
      .from(systemHealthChecks)
      .where(
        and(
          or(
            eq(systemHealthChecks.status, 'unhealthy'),
            eq(systemHealthChecks.status, 'critical')
          ),
          eq(systemHealthChecks.alertSent, false)
        )
      );

    console.log(`[HealthAlerter] Found ${unhealthyServices.length} services needing alerts`);

    for (const service of unhealthyServices) {
      try {
        await sendHealthAlert(service);
        results.alertsSent++;
        console.log(`[HealthAlerter] Alert sent for ${service.serviceName}`);
      } catch (error) {
        const errorMsg = `Failed to send alert for ${service.serviceName}: ${error}`;
        console.error(`[HealthAlerter] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[HealthAlerter] Check complete. Alerts sent: ${results.alertsSent}, Errors: ${results.errors.length}`);
  } catch (error) {
    console.error('[HealthAlerter] Error checking health alerts:', error);
    results.errors.push(`Health check failed: ${error}`);
  }

  return results;
}

/**
 * Send a health alert email for a specific service
 */
async function sendHealthAlert(
  healthCheck: typeof systemHealthChecks.$inferSelect
): Promise<void> {
  const { serviceName, serviceType, status, statusMessage, consecutiveFailures, lastError, lastCheckedAt } = healthCheck;

  // Only send for unhealthy or critical
  if (!ALERTABLE_STATUSES.includes(status)) {
    return;
  }

  console.log(`[HealthAlerter] Sending ${status} alert for ${serviceName}...`);

  // Render email
  const emailHtml = await render(
    SystemHealthAlertEmail({
      serviceName,
      serviceType,
      status: status as 'critical' | 'unhealthy' | 'degraded',
      statusMessage: statusMessage || '',
      consecutiveFailures,
      lastError: lastError || undefined,
      lastCheckedAt: lastCheckedAt?.toISOString() || new Date().toISOString(),
    })
  );

  // Send to all admin emails
  const subject = status === 'critical'
    ? `🚨 URGENT: ${serviceName} is CRITICAL`
    : `⚠️ Alert: ${serviceName} is ${status}`;

  const resendClient = getResendClient();
  
  // Track send results for each recipient
  const sendResults: { email: string; success: boolean; error?: string }[] = [];
  
  for (const adminEmail of ADMIN_EMAILS) {
    try {
      await resendClient.emails.send({
        from: 'Economy Plumbing Monitoring <noreply@economyplumbing.com>',
        to: adminEmail,
        subject,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'health_alert' },
          { name: 'service', value: serviceName },
          { name: 'status', value: status },
        ],
      });

      sendResults.push({ email: adminEmail, success: true });
      console.log(`[HealthAlerter] Alert email sent to ${adminEmail}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      sendResults.push({ email: adminEmail, success: false, error: errorMsg });
      console.error(`[HealthAlerter] Failed to send alert to ${adminEmail}:`, error);
    }
  }

  // Check if all sends succeeded
  const allSucceeded = sendResults.every(r => r.success);
  const successCount = sendResults.filter(r => r.success).length;
  
  if (!allSucceeded) {
    const failedRecipients = sendResults
      .filter(r => !r.success)
      .map(r => `${r.email}: ${r.error}`)
      .join(', ');
    
    // Don't mark as sent if any recipient failed - allow retry on next check
    const errorMsg = `Partial failure sending alert for ${serviceName}. ` +
      `${successCount}/${sendResults.length} succeeded. Failed: ${failedRecipients}`;
    console.error(`[HealthAlerter] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Only mark alert as sent if ALL recipients succeeded
  await db
    .update(systemHealthChecks)
    .set({
      alertSent: true,
      alertSentAt: new Date(),
    })
    .where(
      and(
        eq(systemHealthChecks.serviceName, serviceName),
        eq(systemHealthChecks.serviceType, serviceType)
      )
    );

  console.log(`[HealthAlerter] Alert marked as sent for ${serviceName} (${successCount}/${sendResults.length} recipients)`);
}

/**
 * Reset alert status when a service becomes healthy again
 * This allows new alerts to be sent if the service degrades again
 */
export async function resetHealthAlertIfHealthy(
  serviceName: string,
  serviceType: string
): Promise<void> {
  const [healthCheck] = await db
    .select()
    .from(systemHealthChecks)
    .where(
      and(
        eq(systemHealthChecks.serviceName, serviceName),
        eq(systemHealthChecks.serviceType, serviceType),
        eq(systemHealthChecks.status, 'healthy'),
        eq(systemHealthChecks.alertSent, true)
      )
    )
    .limit(1);

  if (healthCheck) {
    console.log(`[HealthAlerter] Resetting alert status for ${serviceName} (now healthy)`);
    await db
      .update(systemHealthChecks)
      .set({
        alertSent: false,
        alertSentAt: null,
        alertAcknowledgedAt: null,
      })
      .where(
        and(
          eq(systemHealthChecks.serviceName, serviceName),
          eq(systemHealthChecks.serviceType, serviceType)
        )
      );
  }
}

/**
 * Check for services that have recovered and reset their alert status
 */
export async function resetAlertsForRecoveredServices(): Promise<number> {
  const result = await db
    .update(systemHealthChecks)
    .set({
      alertSent: false,
      alertSentAt: null,
      alertAcknowledgedAt: null,
    })
    .where(
      and(
        eq(systemHealthChecks.status, 'healthy'),
        eq(systemHealthChecks.alertSent, true)
      )
    );

  const resetCount = result.rowCount || 0;
  if (resetCount > 0) {
    console.log(`[HealthAlerter] Reset ${resetCount} alert(s) for recovered services`);
  }

  return resetCount;
}
