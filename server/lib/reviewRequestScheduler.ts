/**
 * Review Request Drip Campaign Scheduler
 * 
 * Automatically sends 4-email review request sequence over 21 days:
 * - Email 1: Day 1 after job completion
 * - Email 2: Day 7 after job completion
 * - Email 3: Day 14 after job completion
 * - Email 4: Day 21 after job completion
 * 
 * Features:
 * - Auto-stops when customer submits review
 * - Checks master email switch before sending
 * - Requires configured phone number
 * - Uses database templates or AI generation
 * - Tracks email opens, clicks, and review submissions
 */

import { db } from "../db";
import { reviewRequests, reviewEmailTemplates, jobCompletions, reviewFeedback, customersXlsx, contactsXlsx, systemSettings, emailSendLog } from "../../shared/schema";
import { eq, and, lt, gte, isNull, or, sql } from "drizzle-orm";
import { generateEmail } from "./aiEmailGenerator";
import { getUncachableResendClient } from '../email';
import { sendReviewRequestSms } from "./simpletexting";

// ServiceTitan API polling removed - system is webhook-only
// Mailgun forwards all ServiceTitan invoice emails → webhook processes PDFs instantly

interface EmailSettings {
  masterEmailEnabled: boolean;
  reviewRequestEnabled: boolean;
  // Campaign-specific phone numbers
  reviewRequestPhone: string | null;
  referralNurturePhone: string | null;
  quoteFollowupPhone: string | null;
}

interface JobCompletion {
  id: string;
  jobId: number; // ServiceTitan job ID
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName?: string;
  invoiceTotal?: number; // In cents
  completionDate: Date;
  technicianName?: string;
  jobNotes?: string;
  isQuoteOnly?: boolean; // True for $0 jobs (quotes/estimates)
}

class ReviewRequestScheduler {
  // Scheduler now only processes pending emails - webhook creates review requests

  /**
   * Get email campaign settings from database
   */
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      const dbSettings = await db.select().from(systemSettings);
      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

      return {
        masterEmailEnabled: settingsMap.get('review_master_email_switch') === 'true',
        reviewRequestEnabled: settingsMap.get('review_drip_enabled') === 'true',
        // Campaign-specific phone numbers
        reviewRequestPhone: settingsMap.get('review_request_phone_number') || null,
        referralNurturePhone: settingsMap.get('referral_nurture_phone_number') || null,
        quoteFollowupPhone: settingsMap.get('quote_followup_phone_number') || null,
      };
    } catch (error) {
      console.error("[Review Request Scheduler] Error fetching settings:", error);
      return {
        masterEmailEnabled: false,
        reviewRequestEnabled: false,
        reviewRequestPhone: null,
        referralNurturePhone: null,
        quoteFollowupPhone: null,
      };
    }
  }

  /**
   * Check if campaign should send emails (global check)
   */
  async canSendEmails(): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await this.getEmailSettings();

    if (!settings.masterEmailEnabled) {
      return { allowed: false, reason: "Master email switch is disabled" };
    }

    if (!settings.reviewRequestEnabled) {
      return { allowed: false, reason: "Review request campaign is disabled" };
    }

    return { allowed: true };
  }

  /**
   * Check if specific campaign type can send (per-campaign validation)
   */
  canSendCampaign(campaignType: 'review_request' | 'quote_followup', settings: EmailSettings): { allowed: boolean; reason?: string } {
    if (!settings.masterEmailEnabled) {
      return { allowed: false, reason: "Master email switch disabled" };
    }

    if (!settings.reviewRequestEnabled) {
      return { allowed: false, reason: "Review drip campaigns disabled" };
    }

    // Campaign-specific phone validation
    const requiredPhone = campaignType === 'quote_followup' 
      ? settings.quoteFollowupPhone 
      : settings.reviewRequestPhone;

    if (!requiredPhone) {
      return { 
        allowed: false, 
        reason: `${campaignType === 'quote_followup' ? 'Quote follow-up' : 'Review request'} phone number not configured` 
      };
    }

    return { allowed: true };
  }

  // REMOVED: detectCompletedJobs() - ServiceTitan API polling removed (webhook-only system)
  // REMOVED: createReviewRequest() - Review requests now created by webhook, not scheduler

  /**
   * Get email template from database or generate with AI
   */
  async getEmailContent(emailNumber: number, job: JobCompletion, settings: EmailSettings) {
    try {
      // Determine campaign type based on whether job is quote-only
      const campaignType = job.isQuoteOnly ? 'quote_followup' : 'review_request';
      
      // First, try to get template from database
      const [template] = await db
        .select()
        .from(reviewEmailTemplates)
        .where(
          and(
            eq(reviewEmailTemplates.campaignType, campaignType),
            eq(reviewEmailTemplates.emailNumber, emailNumber)
          )
        )
        .limit(1);

      if (template) {
        console.log(`[Review Request Scheduler] Using database template for ${campaignType} email ${emailNumber}`);
        return {
          subject: template.subject,
          htmlContent: template.htmlContent,
          plainTextContent: template.plainTextContent,
        };
      }

      // No template found, generate with AI
      console.log(`[Review Request Scheduler] No template found, generating ${campaignType} email ${emailNumber} with AI`);
      
      // Select campaign-specific phone number
      const phoneNumber = campaignType === 'quote_followup' 
        ? settings.quoteFollowupPhone 
        : settings.reviewRequestPhone;
      
      const generated = await generateEmail({
        campaignType: campaignType as 'review_request' | 'quote_followup',
        emailNumber: emailNumber as 1 | 2 | 3 | 4,
        jobDetails: {
          customerId: job.customerId,
          customerName: job.customerName,
          serviceType: job.serviceName,
          jobAmount: job.invoiceTotal,
          jobDate: job.completionDate,
        },
        phoneNumber: phoneNumber || undefined,
      });

      return {
        subject: generated.subject,
        htmlContent: generated.htmlContent,
        plainTextContent: generated.plainTextContent,
      };
    } catch (error) {
      console.error(`[Review Request Scheduler] Error getting email content for email ${emailNumber}:`, error);
      throw error;
    }
  }

  /**
   * Send review request email
   */
  async sendReviewEmail(reviewRequestId: string, emailNumber: number) {
    try {
      // Get review request details with job completion info
      const [result] = await db
        .select({
          reviewRequest: reviewRequests,
          jobCompletion: jobCompletions,
        })
        .from(reviewRequests)
        .innerJoin(jobCompletions, eq(reviewRequests.jobCompletionId, jobCompletions.id))
        .where(eq(reviewRequests.id, reviewRequestId))
        .limit(1);

      if (!result) {
        console.error(`[Review Request Scheduler] Review request ${reviewRequestId} not found`);
        return false;
      }

      const { reviewRequest, jobCompletion } = result;

      // Check if customer already submitted review
      if (reviewRequest.reviewSubmittedAt) {
        console.log(`[Review Request Scheduler] Customer already submitted review, stopping campaign`);
        await db
          .update(reviewRequests)
          .set({
            status: 'completed',
            completedAt: new Date(),
            stopReason: 'review_submitted',
          })
          .where(eq(reviewRequests.id, reviewRequestId));
        return false;
      }

      const settings = await this.getEmailSettings();
      
      // Check suppression list FIRST (hard bounces, spam complaints)
      const { emailSuppressionList } = await import('@shared/schema');
      const suppressedResults = await db
        .select()
        .from(emailSuppressionList)
        .where(eq(emailSuppressionList.email, jobCompletion.customerEmail || ''))
        .limit(1);
      
      if (suppressedResults.length > 0) {
        const suppressed = suppressedResults[0];
        console.log(`[Review Request Scheduler] Email ${jobCompletion.customerEmail} is suppressed (${suppressed.reason}), stopping campaign permanently`);
        await db
          .update(reviewRequests)
          .set({
            status: 'stopped',
            completedAt: new Date(),
            stopReason: `suppressed_${suppressed.reason}`, // e.g., 'suppressed_hard_bounce', 'suppressed_spam_complaint'
          })
          .where(eq(reviewRequests.id, reviewRequestId));
        return false;
      }
      
      // Re-validate campaign-specific phone BEFORE sending (settings may have changed)
      const campaignType = jobCompletion.isQuoteOnly ? 'quote_followup' : 'review_request';
      const validation = this.canSendCampaign(campaignType, settings);
      
      if (!validation.allowed) {
        console.log(`[Review Request Scheduler] Cannot send ${campaignType} email ${emailNumber}: ${validation.reason}`);
        return false;
      }
      
      // Check email preferences before sending
      const { canSendEmail, addUnsubscribeFooter, addUnsubscribeFooterPlainText } = await import('./emailPreferenceEnforcer');
      const prefCheck = await canSendEmail(reviewRequest.customerEmail, { type: 'review' });
      
      if (!prefCheck.canSend) {
        console.log(`[Review Request Scheduler] Skipping email - ${prefCheck.reason}`);
        
        // Mark as skipped
        await db
          .update(reviewRequests)
          .set({
            status: 'skipped',
            completedAt: new Date(),
            stopReason: 'unsubscribed_from_category',
          })
          .where(eq(reviewRequests.id, reviewRequestId));
        
        return false;
      }
      
      // Get email content
      const emailContent = await this.getEmailContent(
        emailNumber,
        {
          id: jobCompletion.id,
          jobId: jobCompletion.jobId || 0, // Default to 0 if webhook-created without ST job ID
          customerId: jobCompletion.customerId,
          customerName: jobCompletion.customerName,
          customerEmail: jobCompletion.customerEmail || '',
          customerPhone: jobCompletion.customerPhone || undefined,
          serviceName: jobCompletion.serviceName || undefined,
          invoiceTotal: jobCompletion.invoiceTotal || undefined,
          completionDate: jobCompletion.completionDate,
          technicianName: jobCompletion.technicianName || undefined,
        },
        settings
      );

      // Send email via Resend
      const { client: resend, fromEmail } = await getUncachableResendClient();
      
      // Add unsubscribe footer to email content
      const htmlWithFooter = addUnsubscribeFooter(emailContent.htmlContent, prefCheck.unsubscribeUrl!);
      const plainWithFooter = addUnsubscribeFooterPlainText(emailContent.plainTextContent, prefCheck.unsubscribeUrl!);
      
      console.log(`[Review Request Scheduler] Sending email ${emailNumber} to ${reviewRequest.customerEmail}`);
      
      const emailResult = await resend.emails.send({
        from: fromEmail,
        to: reviewRequest.customerEmail,
        replyTo: 'hello@plumbersthatcare.com',
        subject: emailContent.subject,
        html: htmlWithFooter,
        text: plainWithFooter,
        headers: {
          'List-Unsubscribe': prefCheck.listUnsubscribeHeader!,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (emailResult.error) {
        console.error(`[Review Request Scheduler] Resend error:`, emailResult.error);
        return false;
      }

      console.log(`[Review Request Scheduler] Email sent successfully. Resend ID: ${emailResult.data?.id}`);

      // Create emailSendLog record for engagement tracking
      await db.insert(emailSendLog).values({
        campaignType,
        campaignRecordId: reviewRequestId,
        emailNumber,
        recipientEmail: reviewRequest.customerEmail,
        recipientName: jobCompletion.customerName,
        customerId: jobCompletion.customerId,
        resendEmailId: emailResult.data?.id || null,
        resendStatus: 'sent',
      });

      // Update review request with email sent timestamp
      const updateFields: any = {};

      // Set specific email timestamp and status
      if (emailNumber === 1) {
        updateFields.email1SentAt = new Date();
        updateFields.status = 'email1_sent';
      }
      if (emailNumber === 2) {
        updateFields.email2SentAt = new Date();
        updateFields.status = 'email2_sent';
      }
      if (emailNumber === 3) {
        updateFields.email3SentAt = new Date();
        updateFields.status = 'email3_sent';
      }
      if (emailNumber === 4) {
        updateFields.email4SentAt = new Date();
        updateFields.status = 'completed';
        updateFields.completedAt = new Date();
        updateFields.stopReason = 'sequence_completed';
      }

      await db
        .update(reviewRequests)
        .set(updateFields)
        .where(eq(reviewRequests.id, reviewRequestId));

      console.log(`[Review Request Scheduler] Successfully sent email ${emailNumber} for review request ${reviewRequestId}`);
      return true;
    } catch (error) {
      console.error(`[Review Request Scheduler] Error sending email ${emailNumber} for review request ${reviewRequestId}:`, error);
      return false;
    }
  }

  /**
   * Process pending review request emails
   * 
   * NOTE: This currently handles review_request and quote_followup campaigns only.
   * Referral nurture campaigns (referralNurtureCampaigns table) are NOT processed here.
   * TODO: Implement separate processPendingReferralNurture() function to send
   * referral nurture emails (4 emails over 6 months) using settings.referralNurturePhone
   */
  async processPendingEmails() {
    try {
      const { allowed, reason } = await this.canSendEmails();
      if (!allowed) {
        console.log(`[Review Request Scheduler] Skipping email sends: ${reason}`);
        return;
      }

      const settings = await this.getEmailSettings();
      const now = new Date();
      
      // Find active review requests that need emails sent (join with job_completions for completion date)
      const pendingRequests = await db
        .select({
          reviewRequest: reviewRequests,
          jobCompletion: jobCompletions,
        })
        .from(reviewRequests)
        .innerJoin(jobCompletions, eq(reviewRequests.jobCompletionId, jobCompletions.id))
        .where(
          and(
            or(
              eq(reviewRequests.status, 'queued'),
              eq(reviewRequests.status, 'email1_sent'),
              eq(reviewRequests.status, 'email2_sent'),
              eq(reviewRequests.status, 'email3_sent')
            ),
            isNull(reviewRequests.reviewSubmittedAt),
            // Only process campaigns that have reached their scheduled start time (or have no schedule)
            or(
              isNull(reviewRequests.scheduledStart),
              sql`${reviewRequests.scheduledStart} <= ${now}`
            )
          )
        );

      console.log(`[Review Request Scheduler] Found ${pendingRequests.length} active review/quote requests`);

      for (const { reviewRequest, jobCompletion } of pendingRequests) {
        // Determine campaign type
        const campaignType = jobCompletion.isQuoteOnly ? 'quote_followup' : 'review_request';
        const requiredPhone = campaignType === 'quote_followup' 
          ? settings.quoteFollowupPhone 
          : settings.reviewRequestPhone;
        
        // Skip if campaign-specific phone number is not configured
        if (!requiredPhone) {
          console.log(`[Review Request Scheduler] Skipping ${campaignType} request ${reviewRequest.id} - no phone number configured`);
          continue;
        }
        
        const daysSinceCompletion = Math.floor(
          (now.getTime() - jobCompletion.completionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine which email to send based on days since completion
        let emailToSend: number | null = null;

        if (daysSinceCompletion >= 1 && !reviewRequest.email1SentAt) {
          emailToSend = 1;
        } else if (daysSinceCompletion >= 7 && !reviewRequest.email2SentAt) {
          emailToSend = 2;
        } else if (daysSinceCompletion >= 14 && !reviewRequest.email3SentAt) {
          emailToSend = 3;
        } else if (daysSinceCompletion >= 21 && !reviewRequest.email4SentAt) {
          emailToSend = 4;
        }

        if (emailToSend) {
          console.log(`[Review Request Scheduler] Sending ${campaignType} email ${emailToSend} for request ${reviewRequest.id} (${daysSinceCompletion} days since job)`);
          await this.sendReviewEmail(reviewRequest.id, emailToSend);
        }
      }
    } catch (error) {
      console.error("[Review Request Scheduler] Error processing pending emails:", error);
    }
  }

  // REMOVED: run(), start(), stop() - Worker now only calls processPendingEmails() directly
  // No need for scheduler loop since webhook creates review requests automatically
}

// Singleton instance
let reviewRequestScheduler: ReviewRequestScheduler | null = null;

export function getReviewRequestScheduler(): ReviewRequestScheduler {
  if (!reviewRequestScheduler) {
    reviewRequestScheduler = new ReviewRequestScheduler();
  }
  return reviewRequestScheduler;
}
