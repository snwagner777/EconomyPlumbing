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
import { reviewRequests, reviewEmailTemplates, jobCompletions, reviewFeedback, customersXlsx, contactsXlsx, systemSettings } from "../../shared/schema";
import { eq, and, lt, gte, isNull, or, sql } from "drizzle-orm";
import { generateEmail } from "./aiEmailGenerator";
import { Resend } from "resend";

interface ServiceTitanConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  appKey: string;
}

interface ServiceTitanJob {
  id: number;
  customerId: number;
  completedOn: string;
  total: number;
  summary: string;
  jobTypeId: number;
  soldById: number;
}

interface ServiceTitanJobsResponse {
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalCount?: number;
  data: ServiceTitanJob[];
}

class ServiceTitanJobsAPI {
  private config: ServiceTitanConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ServiceTitanConfig) {
    this.config = config;
    this.baseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${config.tenantId}`;
  }

  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    const tokenUrl = 'https://auth.servicetitan.io/connect/token';
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`ServiceTitan auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  }

  async getCompletedJobs(completedOnOrAfter: Date): Promise<ServiceTitanJob[]> {
    await this.authenticate();

    const isoDate = completedOnOrAfter.toISOString();
    const url = `${this.baseUrl}/jobs?jobStatus=Completed&completedOnOrAfter=${encodeURIComponent(isoDate)}&pageSize=50`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'ST-App-Key': this.config.appKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs: ${response.statusText}`);
    }

    const data: ServiceTitanJobsResponse = await response.json();
    return data.data || [];
  }
}

interface EmailSettings {
  masterEmailEnabled: boolean;
  phoneNumber: string | null;
  reviewRequestEnabled: boolean;
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
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Get email campaign settings from database
   */
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      const dbSettings = await db.select().from(systemSettings);
      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

      return {
        masterEmailEnabled: settingsMap.get('review_master_email_switch') === 'true',
        phoneNumber: settingsMap.get('review_request_phone_number') || null,
        reviewRequestEnabled: settingsMap.get('review_drip_enabled') === 'true',
      };
    } catch (error) {
      console.error("[Review Request Scheduler] Error fetching settings:", error);
      return {
        masterEmailEnabled: false,
        phoneNumber: null,
        reviewRequestEnabled: false,
      };
    }
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
   */
  async detectCompletedJobs(): Promise<JobCompletion[]> {
    try {
      console.log("[Review Request Scheduler] Checking for new completed jobs...");

      // Initialize ServiceTitan API
      const config: ServiceTitanConfig = {
        clientId: process.env.SERVICETITAN_CLIENT_ID!,
        clientSecret: process.env.SERVICETITAN_CLIENT_SECRET!,
        tenantId: process.env.SERVICETITAN_TENANT_ID!,
        appKey: process.env.SERVICETITAN_APP_KEY!,
      };

      const stApi = new ServiceTitanJobsAPI(config);

      // Fetch jobs completed in last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const stJobs = await stApi.getCompletedJobs(yesterday);
      console.log(`[Review Request Scheduler] Found ${stJobs.length} completed jobs from ServiceTitan API`);

      const newJobsToProcess: JobCompletion[] = [];

      for (const stJob of stJobs) {
        // Check if we've already created a job_completion for this ServiceTitan job
        const existingCompletion = await db
          .select()
          .from(jobCompletions)
          .where(eq(jobCompletions.jobId, stJob.id))
          .limit(1);

        if (existingCompletion.length > 0) {
          continue;
        }

        // Get customer details from customers_xlsx
        const customer = await db
          .select()
          .from(customersXlsx)
          .where(eq(customersXlsx.id, stJob.customerId))
          .limit(1);

        if (customer.length === 0) {
          console.log(`[Review Request Scheduler] No customer found for ST customer ID ${stJob.customerId}, skipping`);
          continue;
        }

        // Get customer email from contacts_xlsx
        const emailContact = await db
          .select()
          .from(contactsXlsx)
          .where(
            and(
              eq(contactsXlsx.customerId, stJob.customerId),
              sql`LOWER(${contactsXlsx.contactType}) = 'email'`
            )
          )
          .limit(1);

        if (emailContact.length === 0 || !emailContact[0].normalizedValue) {
          console.log(`[Review Request Scheduler] No email for customer ${stJob.customerId}, skipping`);
          continue;
        }

        // Extract first email if comma-separated
        const customerEmail = emailContact[0].normalizedValue.split(',')[0].trim();

        // Create job_completion entry
        const invoiceTotal = stJob.total ? Math.round(stJob.total * 100) : 0;
        const isQuoteOnly = invoiceTotal === 0; // Flag $0 jobs as quotes/estimates
        
        const jobCompletion: JobCompletion = {
          id: `job-${stJob.id}`,
          jobId: stJob.id,
          customerId: stJob.customerId,
          customerName: customer[0].name || 'Valued Customer',
          customerEmail: customerEmail,
          serviceName: stJob.summary || 'Service',
          invoiceTotal: invoiceTotal || undefined,
          completionDate: new Date(stJob.completedOn),
          isQuoteOnly,
        };

        // Insert job_completion to database
        await db.insert(jobCompletions).values(jobCompletion);
        console.log(`[Review Request Scheduler] Created job_completion for job ${stJob.id}`);

        newJobsToProcess.push(jobCompletion);
      }

      console.log(`[Review Request Scheduler] Processed ${newJobsToProcess.length} new completed jobs`);
      return newJobsToProcess;
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
          jobCompletionId: job.id, // Link to job_completions table
          customerId: job.customerId,
          customerEmail: job.customerEmail,
          status: 'queued', // Initial status
          createdAt: new Date(),
        })
        .returning();

      console.log(`[Review Request Scheduler] Created review request ${reviewRequest.id} for job ${job.jobId}`);
      return reviewRequest.id;
    } catch (error) {
      console.error(`[Review Request Scheduler] Error creating review request for job ${job.jobId}:`, error);
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
            eq(reviewEmailTemplates.emailNumber, emailNumber)
          )
        )
        .limit(1);

      if (template) {
        console.log(`[Review Request Scheduler] Using database template for email ${emailNumber}`);
        return {
          subject: template.subject,
          htmlContent: template.htmlContent,
          plainTextContent: template.plainTextContent,
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
          serviceType: job.serviceName,
          jobAmount: job.invoiceTotal,
          jobDate: job.completionDate,
        },
        phoneNumber: settings.phoneNumber || undefined,
      });

      return {
        subject: generated.subject,
        htmlContent: generated.bodyHtml,
        plainTextContent: generated.bodyPlain,
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
          jobId: jobCompletion.jobId,
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
      if (!process.env.RESEND_API_KEY) {
        console.error('[Review Request Scheduler] RESEND_API_KEY not configured');
        return false;
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Add unsubscribe footer to email content
      const htmlWithFooter = addUnsubscribeFooter(emailContent.htmlContent, prefCheck.unsubscribeUrl!);
      const plainWithFooter = addUnsubscribeFooterPlainText(emailContent.plainTextContent, prefCheck.unsubscribeUrl!);
      
      console.log(`[Review Request Scheduler] Sending email ${emailNumber} to ${reviewRequest.customerEmail}`);
      
      const emailResult = await resend.emails.send({
        from: 'Economy Plumbing Services <reviews@economyplumbing.com>',
        to: reviewRequest.customerEmail,
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
   */
  async processPendingEmails() {
    try {
      const { allowed, reason } = await this.canSendEmails();
      if (!allowed) {
        console.log(`[Review Request Scheduler] Skipping email sends: ${reason}`);
        return;
      }

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
            isNull(reviewRequests.reviewSubmittedAt)
          )
        );

      console.log(`[Review Request Scheduler] Found ${pendingRequests.length} active review requests`);

      for (const { reviewRequest, jobCompletion } of pendingRequests) {
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
          console.log(`[Review Request Scheduler] Sending email ${emailToSend} for request ${reviewRequest.id} (${daysSinceCompletion} days since job)`);
          await this.sendReviewEmail(reviewRequest.id, emailToSend);
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
