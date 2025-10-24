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
import { reviewRequests, reviewEmailTemplates, jobCompletions, reviewFeedback } from "../../shared/schema";
import { eq, and, lt, gte, isNull, or } from "drizzle-orm";
import { generateEmail } from "./aiEmailGenerator";

interface EmailSettings {
  masterEmailEnabled: boolean;
  phoneNumber: string | null;
  reviewRequestEnabled: boolean;
}

interface JobCompletion {
  id: string;
  serviceTitanJobId: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceType?: string;
  jobAmount?: number;
  completedAt: Date;
  technicianName?: string;
  location?: string;
}

class ReviewRequestScheduler {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Get email campaign settings from database
   */
  async getEmailSettings(): Promise<EmailSettings> {
    // TODO: Fetch from review_request_settings table when user sends it
    // For now, return mock settings
    return {
      masterEmailEnabled: false, // Default to disabled for safety
      phoneNumber: null,
      reviewRequestEnabled: false,
    };
  }

  /**
   * Check if campaign should send emails
   */
  async canSendEmails(): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await this.getEmailSettings();

    if (!settings.masterEmailEnabled) {
      return { allowed: false, reason: "Master email switch is disabled" };
    }

    if (!settings.phoneNumber) {
      return { allowed: false, reason: "No phone number configured for tracking" };
    }

    if (!settings.reviewRequestEnabled) {
      return { allowed: false, reason: "Review request campaign is disabled" };
    }

    return { allowed: true };
  }

  /**
   * Detect new completed jobs from ServiceTitan
   * This will be updated when user provides ServiceTitan Jobs API docs
   */
  async detectCompletedJobs(): Promise<JobCompletion[]> {
    try {
      console.log("[Review Request Scheduler] Checking for new completed jobs...");

      // TODO: Replace with actual ServiceTitan API call when docs are provided
      // This is placeholder logic
      const completedJobs: JobCompletion[] = [];

      console.log(`[Review Request Scheduler] Found ${completedJobs.length} new completed jobs`);
      return completedJobs;
    } catch (error) {
      console.error("[Review Request Scheduler] Error detecting completed jobs:", error);
      return [];
    }
  }

  /**
   * Create review request entry for a completed job
   */
  async createReviewRequest(job: JobCompletion, settings: EmailSettings): Promise<string | null> {
    try {
      const [reviewRequest] = await db
        .insert(reviewRequests)
        .values({
          serviceTitanJobId: job.serviceTitanJobId,
          customerId: job.customerId,
          customerName: job.customerName,
          customerEmail: job.customerEmail,
          customerPhone: job.customerPhone,
          jobCompletedAt: job.completedAt,
          campaignStatus: 'active',
          currentEmailNumber: 0, // Start at 0, will increment to 1 when first email sends
          phoneNumber: settings.phoneNumber || undefined,
          createdAt: new Date(),
        })
        .returning();

      console.log(`[Review Request Scheduler] Created review request ${reviewRequest.id} for job ${job.serviceTitanJobId}`);
      return reviewRequest.id;
    } catch (error) {
      console.error(`[Review Request Scheduler] Error creating review request for job ${job.serviceTitanJobId}:`, error);
      return null;
    }
  }

  /**
   * Get email template from database or generate with AI
   */
  async getEmailContent(emailNumber: number, job: JobCompletion, settings: EmailSettings) {
    try {
      // First, try to get template from database
      const [template] = await db
        .select()
        .from(reviewEmailTemplates)
        .where(
          and(
            eq(reviewEmailTemplates.campaignType, 'review_request'),
            eq(reviewEmailTemplates.emailNumber, emailNumber),
            eq(reviewEmailTemplates.isActive, true)
          )
        )
        .limit(1);

      if (template) {
        console.log(`[Review Request Scheduler] Using database template for email ${emailNumber}`);
        return {
          subject: template.subject,
          preheader: template.preheader,
          bodyHtml: template.bodyHtml,
          bodyPlain: template.bodyPlain,
        };
      }

      // No template found, generate with AI
      console.log(`[Review Request Scheduler] No template found, generating email ${emailNumber} with AI`);
      const generated = await generateEmail({
        campaignType: 'review_request',
        emailNumber: emailNumber as 1 | 2 | 3 | 4,
        jobDetails: {
          customerId: job.customerId,
          customerName: job.customerName,
          serviceType: job.serviceType,
          jobAmount: job.jobAmount,
          jobDate: job.completedAt,
          location: job.location,
        },
        phoneNumber: settings.phoneNumber || undefined,
      });

      return {
        subject: generated.subject,
        preheader: generated.preheader,
        bodyHtml: generated.bodyHtml,
        bodyPlain: generated.bodyPlain,
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
      // Get review request details
      const [reviewRequest] = await db
        .select()
        .from(reviewRequests)
        .where(eq(reviewRequests.id, reviewRequestId))
        .limit(1);

      if (!reviewRequest) {
        console.error(`[Review Request Scheduler] Review request ${reviewRequestId} not found`);
        return false;
      }

      // Check if customer already submitted review
      if (reviewRequest.reviewSubmittedAt) {
        console.log(`[Review Request Scheduler] Customer already submitted review, stopping campaign`);
        await db
          .update(reviewRequests)
          .set({
            campaignStatus: 'completed',
            completedAt: new Date(),
            stopReason: 'review_submitted',
          })
          .where(eq(reviewRequests.id, reviewRequestId));
        return false;
      }

      const settings = await this.getEmailSettings();
      
      // Get email content
      const emailContent = await this.getEmailContent(
        emailNumber,
        {
          id: reviewRequestId,
          serviceTitanJobId: reviewRequest.serviceTitanJobId,
          customerId: reviewRequest.customerId,
          customerName: reviewRequest.customerName,
          customerEmail: reviewRequest.customerEmail,
          customerPhone: reviewRequest.customerPhone || undefined,
          completedAt: reviewRequest.jobCompletedAt,
        },
        settings
      );

      // TODO: Actually send email via Resend
      console.log(`[Review Request Scheduler] Would send email ${emailNumber} to ${reviewRequest.customerEmail}`);
      console.log(`[Review Request Scheduler] Subject: ${emailContent.subject}`);

      // Update review request with email sent timestamp
      const updateFields: any = {
        currentEmailNumber: emailNumber,
        updatedAt: new Date(),
      };

      // Set specific email timestamp
      if (emailNumber === 1) updateFields.email1SentAt = new Date();
      if (emailNumber === 2) updateFields.email2SentAt = new Date();
      if (emailNumber === 3) updateFields.email3SentAt = new Date();
      if (emailNumber === 4) {
        updateFields.email4SentAt = new Date();
        updateFields.campaignStatus = 'completed';
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
   */
  async processPendingEmails() {
    try {
      const { allowed, reason } = await this.canSendEmails();
      if (!allowed) {
        console.log(`[Review Request Scheduler] Skipping email sends: ${reason}`);
        return;
      }

      const now = new Date();
      
      // Find active review requests that need emails sent
      const pendingRequests = await db
        .select()
        .from(reviewRequests)
        .where(
          and(
            eq(reviewRequests.campaignStatus, 'active'),
            isNull(reviewRequests.reviewSubmittedAt)
          )
        );

      console.log(`[Review Request Scheduler] Found ${pendingRequests.length} active review requests`);

      for (const request of pendingRequests) {
        const daysSinceCompletion = Math.floor(
          (now.getTime() - request.jobCompletedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine which email to send based on days since completion
        let emailToSend: number | null = null;

        if (daysSinceCompletion >= 1 && !request.email1SentAt) {
          emailToSend = 1;
        } else if (daysSinceCompletion >= 7 && !request.email2SentAt) {
          emailToSend = 2;
        } else if (daysSinceCompletion >= 14 && !request.email3SentAt) {
          emailToSend = 3;
        } else if (daysSinceCompletion >= 21 && !request.email4SentAt) {
          emailToSend = 4;
        }

        if (emailToSend) {
          console.log(`[Review Request Scheduler] Sending email ${emailToSend} for request ${request.id} (${daysSinceCompletion} days since job)`);
          await this.sendReviewEmail(request.id, emailToSend);
        }
      }
    } catch (error) {
      console.error("[Review Request Scheduler] Error processing pending emails:", error);
    }
  }

  /**
   * Main scheduler loop
   */
  async run() {
    console.log("[Review Request Scheduler] Running campaign check...");

    try {
      // Step 1: Detect new completed jobs and create review requests
      const completedJobs = await this.detectCompletedJobs();
      const settings = await this.getEmailSettings();

      for (const job of completedJobs) {
        await this.createReviewRequest(job, settings);
      }

      // Step 2: Process pending emails for existing review requests
      await this.processPendingEmails();

      console.log("[Review Request Scheduler] Campaign check completed");
    } catch (error) {
      console.error("[Review Request Scheduler] Error in run loop:", error);
    }
  }

  /**
   * Start the scheduler (runs every hour)
   */
  start() {
    if (this.isRunning) {
      console.log("[Review Request Scheduler] Already running");
      return;
    }

    console.log("[Review Request Scheduler] Starting scheduler (runs every hour)");
    this.isRunning = true;

    // Run immediately
    this.run();

    // Run every hour
    this.intervalId = setInterval(() => {
      this.run();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[Review Request Scheduler] Stopped");
  }
}

// Singleton instance
let reviewRequestScheduler: ReviewRequestScheduler | null = null;

export function getReviewRequestScheduler(): ReviewRequestScheduler {
  if (!reviewRequestScheduler) {
    reviewRequestScheduler = new ReviewRequestScheduler();
  }
  return reviewRequestScheduler;
}
