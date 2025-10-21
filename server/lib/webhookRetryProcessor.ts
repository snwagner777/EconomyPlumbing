import { db } from '../db';
import { webhookFailureQueue, type InsertWebhookFailureQueue } from '@shared/schema';
import { eq, and, lte, or, isNull } from 'drizzle-orm';
import { recordSuccess, recordFailure } from './healthMonitor';

/**
 * Webhook Retry Processor
 * 
 * Handles failed webhook events with:
 * - Exponential backoff (1min, 5min, 30min, 2hr, 12hr)
 * - Dead-letter queue for permanently failed webhooks
 * - Automatic retry scheduling
 * - Duplicate prevention
 * 
 * Why This Matters:
 * - Resend webhooks might fail if our server is down/restarting
 * - Without retry, we lose engagement tracking (opens, clicks, bounces)
 * - Emails might not get added to suppression list
 * - Campaign analytics become inaccurate
 */

const RETRY_SCHEDULE_MINUTES = [1, 5, 30, 120, 720]; // 1min, 5min, 30min, 2hr, 12hr
const MAX_RETRY_ATTEMPTS = 5;
const PROCESSING_INTERVAL = 60 * 1000; // Check every 60 seconds

let isProcessing = false;
let processorInterval: NodeJS.Timeout | null = null;

/**
 * Calculate next retry time using exponential backoff
 */
function calculateNextRetryTime(attemptCount: number): Date {
  const minutesDelay = RETRY_SCHEDULE_MINUTES[attemptCount] || RETRY_SCHEDULE_MINUTES[RETRY_SCHEDULE_MINUTES.length - 1];
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + minutesDelay);
  return nextRetry;
}

/**
 * Add a failed webhook to the retry queue
 */
export async function queueFailedWebhook(webhookData: {
  webhookType: string;
  webhookEvent: string;
  rawPayload: any;
  headers: any;
  signature?: string;
  error: string;
}): Promise<void> {
  try {
    console.log(`[Webhook Retry] Queueing failed ${webhookData.webhookType} webhook: ${webhookData.webhookEvent}`);
    
    await db.insert(webhookFailureQueue).values({
      webhookType: webhookData.webhookType,
      webhookEvent: webhookData.webhookEvent,
      rawPayload: webhookData.rawPayload,
      headers: webhookData.headers,
      signature: webhookData.signature,
      attemptCount: 0,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      nextRetryAt: calculateNextRetryTime(0),
      lastError: webhookData.error,
      status: 'pending',
    });
    
    console.log(`[Webhook Retry] ✓ Webhook queued for retry`);
  } catch (error) {
    console.error('[Webhook Retry] ✗ Failed to queue webhook:', error);
  }
}

/**
 * Process a single failed webhook
 */
async function processFailedWebhook(webhook: any): Promise<{ success: boolean; error?: string }> {
  console.log(
    `[Webhook Retry] Processing ${webhook.webhookType} webhook ` +
    `(attempt ${webhook.attemptCount + 1}/${webhook.maxAttempts})`
  );
  
  try {
    // Import webhook handler dynamically based on type
    if (webhook.webhookType === 'resend') {
      // Re-process the Resend webhook
      const { Webhook } = await import('svix');
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        throw new Error('RESEND_WEBHOOK_SECRET not configured');
      }
      
      // Verify signature if available
      let event = webhook.rawPayload;
      if (webhook.signature && webhook.headers) {
        const wh = new Webhook(webhookSecret);
        event = wh.verify(JSON.stringify(webhook.rawPayload), webhook.headers);
      }
      
      // Process the event (same logic as main webhook handler)
      const emailId = event.data?.email_id;
      if (!emailId) {
        throw new Error('No email_id in webhook event');
      }
      
      const { emailSendLog, emailSuppressionList, campaignEmails } = await import('@shared/schema');
      const { sql } = await import('drizzle-orm');
      
      const sendLog = await db.query.emailSendLog.findFirst({
        where: eq(emailSendLog.resendEmailId, emailId),
      });
      
      if (!sendLog) {
        throw new Error(`No send log found for email_id: ${emailId}`);
      }
      
      // Update based on event type
      const updates: any = {};
      
      switch (event.type) {
        case 'email.delivered':
          updates.deliveredAt = new Date(event.created_at);
          updates.resendStatus = 'delivered';
          break;
          
        case 'email.opened':
          updates.openedAt = new Date(event.created_at);
          break;
          
        case 'email.clicked':
          updates.clickedAt = new Date(event.created_at);
          break;
          
        case 'email.bounced':
          updates.bouncedAt = new Date(event.created_at);
          updates.resendStatus = 'bounced';
          
          // Add to suppression list for hard bounces
          if (event.data?.bounce_type === 'hard') {
            await db.insert(emailSuppressionList).values({
              email: sendLog.recipientEmail,
              reason: 'hard_bounce',
              reasonDetails: event.data?.bounce_reason || 'Hard bounce from Resend',
              resendEmailId: emailId,
              campaignId: sendLog.campaignId,
            }).onConflictDoNothing();
          }
          break;
          
        case 'email.complained':
          updates.complainedAt = new Date(event.created_at);
          updates.resendStatus = 'complained';
          
          // Add to suppression list for spam complaints
          await db.insert(emailSuppressionList).values({
            email: sendLog.recipientEmail,
            reason: 'spam_complaint',
            reasonDetails: 'Spam complaint from Resend',
            resendEmailId: emailId,
            campaignId: sendLog.campaignId,
          }).onConflictDoNothing();
          break;
          
        default:
          console.log(`[Webhook Retry] Unhandled event type: ${event.type}`);
      }
      
      // Update the send log
      if (Object.keys(updates).length > 0) {
        await db.update(emailSendLog)
          .set(updates)
          .where(eq(emailSendLog.id, sendLog.id));
          
        // Update campaign email metrics
        if (updates.openedAt) {
          await db.update(campaignEmails)
            .set({ totalOpened: sql`${campaignEmails.totalOpened} + 1` })
            .where(eq(campaignEmails.id, sendLog.campaignEmailId));
        }
        
        if (updates.clickedAt) {
          await db.update(campaignEmails)
            .set({ totalClicked: sql`${campaignEmails.totalClicked} + 1` })
            .where(eq(campaignEmails.id, sendLog.campaignEmailId));
        }
      }
      
      console.log(`[Webhook Retry] ✓ Successfully processed ${webhook.webhookEvent} for email ${emailId}`);
      return { success: true };
    }
    
    // Add more webhook types here as needed (Stripe, Twilio, etc.)
    
    throw new Error(`Unsupported webhook type: ${webhook.webhookType}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Webhook Retry] ✗ Failed to process webhook:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process all pending/retryable webhooks
 */
async function processRetryQueue(): Promise<void> {
  if (isProcessing) {
    console.log('[Webhook Retry] Already processing, skipping...');
    return;
  }
  
  isProcessing = true;
  const startTime = Date.now();
  
  try {
    const now = new Date();
    
    // Find webhooks ready for retry
    const pendingWebhooks = await db
      .select()
      .from(webhookFailureQueue)
      .where(
        and(
          or(
            eq(webhookFailureQueue.status, 'pending'),
            eq(webhookFailureQueue.status, 'retrying')
          ),
          or(
            isNull(webhookFailureQueue.nextRetryAt),
            lte(webhookFailureQueue.nextRetryAt, now)
          )
        )
      )
      .limit(50); // Process up to 50 webhooks at a time
    
    if (pendingWebhooks.length === 0) {
      // Record success with no webhooks to process
      await recordSuccess('webhook_retry_processor', 'processor', {
        statusMessage: 'No webhooks pending',
        executionTimeMs: Date.now() - startTime,
        recordsProcessed: 0
      });
      return;
    }
    
    console.log(`[Webhook Retry] Found ${pendingWebhooks.length} webhooks to process`);
    
    for (const webhook of pendingWebhooks) {
      // Mark as retrying
      await db.update(webhookFailureQueue)
        .set({ 
          status: 'retrying',
          lastAttemptAt: now,
        })
        .where(eq(webhookFailureQueue.id, webhook.id));
      
      // Attempt to process
      const result = await processFailedWebhook(webhook);
      
      if (result.success) {
        // Success! Mark as processed
        await db.update(webhookFailureQueue)
          .set({
            status: 'succeeded',
            processedAt: now,
          })
          .where(eq(webhookFailureQueue.id, webhook.id));
      } else {
        // Failed - check if we should retry or move to dead letter
        const newAttemptCount = webhook.attemptCount + 1;
        
        if (newAttemptCount >= webhook.maxAttempts) {
          // Max attempts reached - move to dead letter queue
          console.error(
            `[Webhook Retry] ✗ Webhook ${webhook.id} exceeded max attempts (${webhook.maxAttempts}), ` +
            `moving to dead letter queue`
          );
          
          await db.update(webhookFailureQueue)
            .set({
              status: 'dead_letter',
              attemptCount: newAttemptCount,
              lastError: result.error || 'Max retry attempts exceeded',
              movedToDeadLetterAt: now,
            })
            .where(eq(webhookFailureQueue.id, webhook.id));
        } else {
          // Schedule next retry with exponential backoff
          const nextRetryAt = calculateNextRetryTime(newAttemptCount);
          
          console.log(
            `[Webhook Retry] Retry ${newAttemptCount}/${webhook.maxAttempts} failed, ` +
            `next retry at ${nextRetryAt.toISOString()}`
          );
          
          await db.update(webhookFailureQueue)
            .set({
              status: 'pending',
              attemptCount: newAttemptCount,
              lastError: result.error || 'Unknown error',
              nextRetryAt,
            })
            .where(eq(webhookFailureQueue.id, webhook.id));
        }
      }
    }
    
    console.log('[Webhook Retry] ✓ Retry queue processing complete');

    // Record successful processing run
    await recordSuccess('webhook_retry_processor', 'processor', {
      statusMessage: `Processed ${pendingWebhooks.length} webhooks`,
      executionTimeMs: Date.now() - startTime,
      recordsProcessed: pendingWebhooks.length
    });
  } catch (error) {
    console.error('[Webhook Retry] ✗ Error processing retry queue:', error);

    // Record failure
    await recordFailure('webhook_retry_processor', 'processor', error as Error, {
      statusMessage: 'Webhook retry queue processing failed',
      executionTimeMs: Date.now() - startTime
    });
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the webhook retry processor
 * Runs every minute to check for webhooks ready for retry
 */
export function startWebhookRetryProcessor(): void {
  console.log('[Webhook Retry] Processor initialized - checking every 60 seconds');
  
  // Run immediately on startup (after 10 seconds)
  setTimeout(() => {
    console.log('[Webhook Retry] Running initial retry queue processing...');
    processRetryQueue().catch(err => {
      console.error('[Webhook Retry] Initial processing failed:', err);
    });
  }, 10000);
  
  // Schedule recurring processing every 60 seconds
  processorInterval = setInterval(() => {
    processRetryQueue().catch(err => {
      console.error('[Webhook Retry] Scheduled processing failed:', err);
    });
  }, PROCESSING_INTERVAL);
}

/**
 * Stop the webhook retry processor (for testing/shutdown)
 */
export function stopWebhookRetryProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log('[Webhook Retry] Processor stopped');
  }
}

/**
 * Get retry processor status (for monitoring)
 */
export async function getWebhookRetryStatus(): Promise<{
  isProcessing: boolean;
  pendingCount: number;
  retryingCount: number;
  deadLetterCount: number;
  succeededCount: number;
}> {
  const stats = await db
    .select()
    .from(webhookFailureQueue);
  
  return {
    isProcessing,
    pendingCount: stats.filter(w => w.status === 'pending').length,
    retryingCount: stats.filter(w => w.status === 'retrying').length,
    deadLetterCount: stats.filter(w => w.status === 'dead_letter').length,
    succeededCount: stats.filter(w => w.status === 'succeeded').length,
  };
}
