/**
 * Health Alerter System
 * 
 * Monitors critical system components and sends email alerts when issues are detected.
 * Checks: Database, ServiceTitan API, Email system, Background workers
 */

import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { serviceTitanAuth } from './servicetitan/auth';
import { getResendClient } from './resendClient';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  error?: string;
  timestamp: Date;
}

interface HealthAlertResult {
  errors: string[];
  alertsSent: number;
  checks: HealthCheckResult[];
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    // Simple query to verify database connection
    await db.execute(sql`SELECT 1`);
    
    return {
      component: 'Database',
      status: 'healthy',
      message: 'PostgreSQL connection successful',
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      component: 'Database',
      status: 'down',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date(),
    };
  }
}

/**
 * Check ServiceTitan API health
 */
async function checkServiceTitan(): Promise<HealthCheckResult> {
  try {
    // Verify required environment variables
    const tenantId = process.env.SERVICETITAN_TENANT_ID;
    if (!tenantId) {
      return {
        component: 'ServiceTitan API',
        status: 'down',
        message: 'Missing required configuration',
        error: 'SERVICETITAN_TENANT_ID environment variable not set',
        timestamp: new Date(),
      };
    }
    
    // Verify OAuth token is valid
    const token = await serviceTitanAuth.getAccessToken();
    
    if (!token) {
      return {
        component: 'ServiceTitan API',
        status: 'down',
        message: 'No valid access token available',
        error: 'Authentication failed - token may be expired or invalid',
        timestamp: new Date(),
      };
    }
    
    // Try a simple API call to verify connectivity
    try {
      await serviceTitanAuth.makeRequest(`settings/v2/tenant/${tenantId}/business-units`, {
        method: 'GET',
      });
      
      return {
        component: 'ServiceTitan API',
        status: 'healthy',
        message: 'API connection successful',
        timestamp: new Date(),
      };
    } catch (apiError: any) {
      return {
        component: 'ServiceTitan API',
        status: 'degraded',
        message: 'API call failed',
        error: apiError.message,
        timestamp: new Date(),
      };
    }
  } catch (error: any) {
    return {
      component: 'ServiceTitan API',
      status: 'down',
      message: 'ServiceTitan health check failed',
      error: error.message,
      timestamp: new Date(),
    };
  }
}

/**
 * Check email system health (Resend)
 */
async function checkEmailSystem(): Promise<HealthCheckResult> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    if (!client) {
      return {
        component: 'Email System',
        status: 'down',
        message: 'Resend client not configured',
        error: 'No API key or client initialization failed',
        timestamp: new Date(),
      };
    }
    
    // Verify API key is valid by checking domains
    // This is a lightweight check that doesn't send any emails
    try {
      await client.domains.list();
      
      return {
        component: 'Email System',
        status: 'healthy',
        message: 'Resend API connection successful',
        timestamp: new Date(),
      };
    } catch (apiError: any) {
      return {
        component: 'Email System',
        status: 'degraded',
        message: 'Resend API call failed',
        error: apiError.message,
        timestamp: new Date(),
      };
    }
  } catch (error: any) {
    return {
      component: 'Email System',
      status: 'down',
      message: 'Email system health check failed',
      error: error.message,
      timestamp: new Date(),
    };
  }
}

/**
 * Check background worker health
 */
async function checkBackgroundWorkers(): Promise<HealthCheckResult> {
  try {
    // Check if worker process is running by looking for recent photo fetch activity
    // The photo_fetch_queue table is actively used by the ServiceTitan photo fetcher worker
    const recentActivity = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM photo_fetch_queue 
      WHERE processed_at IS NOT NULL 
        AND processed_at > NOW() - INTERVAL '24 hours'
    `);
    
    const activityCount = (recentActivity.rows[0] as any)?.count || 0;
    
    // If there's been activity in the last 24 hours, workers are running
    if (activityCount > 0) {
      return {
        component: 'Background Workers',
        status: 'healthy',
        message: `Recent worker activity detected (${activityCount} jobs in last 24h)`,
        timestamp: new Date(),
      };
    }
    
    // No recent activity - workers may still be running but idle
    return {
      component: 'Background Workers',
      status: 'healthy',
      message: 'No recent activity (workers may be idle)',
      timestamp: new Date(),
    };
  } catch (error: any) {
    // Check if error is due to missing table (Postgres error code 42P01)
    const isTableMissing = error.code === '42P01' || error.message?.includes('does not exist');
    
    if (isTableMissing) {
      return {
        component: 'Background Workers',
        status: 'degraded',
        message: 'Photo fetch queue table not found',
        error: 'Worker monitoring unavailable - photo_fetch_queue table missing',
        timestamp: new Date(),
      };
    }
    
    // Other database errors
    return {
      component: 'Background Workers',
      status: 'degraded',
      message: 'Failed to check worker status',
      error: error.message,
      timestamp: new Date(),
    };
  }
}

/**
 * Send email alert for critical failures
 */
async function sendHealthAlert(failedChecks: HealthCheckResult[]): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME;
    
    if (!adminEmail) {
      console.warn('[HealthAlerter] No admin email configured - cannot send alerts');
      return false;
    }
    
    // Build email content
    const failureList = failedChecks
      .map(check => {
        return `
<div style="background-color: #fee; border-left: 4px solid #f44; padding: 15px; margin: 10px 0;">
  <strong style="color: #c00;">❌ ${check.component}</strong><br/>
  <p style="margin: 5px 0;"><strong>Status:</strong> ${check.status}</p>
  <p style="margin: 5px 0;"><strong>Issue:</strong> ${check.message}</p>
  ${check.error ? `<p style="margin: 5px 0; font-family: monospace; font-size: 12px; color: #666;">${check.error}</p>` : ''}
  <p style="margin: 5px 0; color: #888; font-size: 12px;">Detected at: ${check.timestamp.toLocaleString()}</p>
</div>
        `.trim();
      })
      .join('\n');
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>System Health Alert</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #c00; margin-top: 0;">⚠️ System Health Alert</h2>
    
    <p style="font-size: 16px; line-height: 1.6;">
      The following system components are experiencing issues:
    </p>
    
    ${failureList}
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Action Required:</strong> Please investigate these issues immediately to prevent service disruption.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Economy Plumbing Services - System Health Monitor<br/>
      This is an automated alert. Do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
    
    await client.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🚨 System Health Alert - ${failedChecks.length} Component(s) Down`,
      html: emailHtml,
    });
    
    console.log(`[HealthAlerter] Alert email sent to ${adminEmail} for ${failedChecks.length} failed component(s)`);
    return true;
  } catch (error) {
    console.error('[HealthAlerter] Failed to send alert email:', error);
    return false;
  }
}

/**
 * Run all health checks and send alerts if issues are detected
 */
export async function checkAndSendHealthAlerts(): Promise<HealthAlertResult> {
  const errors: string[] = [];
  let alertsSent = 0;
  
  try {
    // Run all health checks in parallel
    const [
      databaseCheck,
      serviceTitanCheck,
      emailCheck,
      workersCheck,
    ] = await Promise.all([
      checkDatabase(),
      checkServiceTitan(),
      checkEmailSystem(),
      checkBackgroundWorkers(),
    ]);
    
    const allChecks = [
      databaseCheck,
      serviceTitanCheck,
      emailCheck,
      workersCheck,
    ];
    
    // Filter for critical failures (down or degraded)
    const failedChecks = allChecks.filter(
      check => check.status === 'down' || check.status === 'degraded'
    );
    
    // Log all check results
    console.log('[HealthAlerter] Health check results:');
    for (const check of allChecks) {
      const statusEmoji = check.status === 'healthy' ? '✓' : check.status === 'degraded' ? '⚠' : '✗';
      console.log(`  ${statusEmoji} ${check.component}: ${check.message}`);
      
      if (check.error) {
        errors.push(`${check.component}: ${check.error}`);
      }
    }
    
    // Send alert if any critical failures detected
    if (failedChecks.length > 0) {
      const alertSent = await sendHealthAlert(failedChecks);
      if (alertSent) {
        alertsSent = 1;
      }
    }
    
    return {
      errors,
      alertsSent,
      checks: allChecks,
    };
  } catch (error: any) {
    const errorMsg = `Health check system error: ${error.message}`;
    console.error('[HealthAlerter]', errorMsg);
    errors.push(errorMsg);
    
    return {
      errors,
      alertsSent,
      checks: [],
    };
  }
}

/**
 * Run a single health check on demand (for admin UI)
 */
export async function runHealthCheck(): Promise<HealthCheckResult[]> {
  const [
    databaseCheck,
    serviceTitanCheck,
    emailCheck,
    workersCheck,
  ] = await Promise.all([
    checkDatabase(),
    checkServiceTitan(),
    checkEmailSystem(),
    checkBackgroundWorkers(),
  ]);
  
  return [
    databaseCheck,
    serviceTitanCheck,
    emailCheck,
    workersCheck,
  ];
}
