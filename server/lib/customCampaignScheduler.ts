/**
 * Custom Email Campaign Scheduler
 * 
 * Handles sending custom email campaigns:
 * - One-time blasts: Send to all segment members at scheduled time
 * - Drip sequences: Send emails based on daysAfterStart scheduling
 * 
 * Features:
 * - Per-customer progress tracking via customCampaignSendLog
 * - Suppression list checking (hard bounces, spam complaints)
 * - Email preference enforcement
 * - Engagement tracking (opens, clicks, bounces, complaints)
 */

import { db } from "../db";
import { 
  customEmailCampaigns, 
  customCampaignEmails, 
  customCampaignSendLog,
  segmentMembership,
  customersXlsx,
  emailSuppressionList,
  systemSettings,
  emailSendLog
} from "../../shared/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { getUncachableResendClient } from '../email';

export class CustomCampaignScheduler {
  constructor() {
    // Email client now obtained via getUncachableResendClient()
  }

  /**
   * Check if email sending is allowed
   */
  private async canSendEmails(): Promise<{ allowed: boolean; reason: string }> {
    const [masterSwitch] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'email_enabled'))
      .limit(1);

    if (masterSwitch && masterSwitch.value === 'false') {
      return { allowed: false, reason: 'Master email switch is disabled' };
    }

    return { allowed: true, reason: '' };
  }

  /**
   * Get customer details from XLSX tables
   */
  private async getCustomerDetails(customerId: number) {
    const customer = await db.query.customersXlsx.findFirst({
      where: eq(customersXlsx.id, customerId),
    });

    if (customer && customer.name && customer.email) {
      return {
        name: customer.name,
        email: customer.email,
      };
    }

    return null;
  }

  /**
   * Send a single campaign email to a customer
   */
  private async sendCampaignEmail(
    campaign: any,
    email: any,
    customer: { id: number; name: string; email: string }
  ): Promise<boolean> {
    try {
      // Check suppression list FIRST
      const suppressed = await db.query.emailSuppressionList.findFirst({
        where: eq(emailSuppressionList.email, customer.email),
      });

      if (suppressed) {
        console.log(`[Custom Campaign] Email ${customer.email} is suppressed (${suppressed.reason}), skipping`);
        return false;
      }

      // Check email preferences
      const { canSendEmail, addUnsubscribeFooter, addUnsubscribeFooterPlainText } = 
        await import('./emailPreferenceEnforcer');
      const prefCheck = await canSendEmail(customer.email, { type: 'marketing' });

      if (!prefCheck.canSend) {
        console.log(`[Custom Campaign] Skipping email - ${prefCheck.reason}`);
        return false;
      }

      // Add unsubscribe footer to HTML
      let finalHtmlContent = email.htmlContent;
      if (prefCheck.canSend) {
        finalHtmlContent = addUnsubscribeFooter(email.htmlContent, customer.email);
      }

      // Add unsubscribe footer to plain text
      let finalPlainTextContent = email.plainTextContent || '';
      if (prefCheck.canSend && finalPlainTextContent) {
        finalPlainTextContent = addUnsubscribeFooterPlainText(finalPlainTextContent, customer.email);
      }

      // Send email via Resend
      const { client: resend, fromEmail } = await getUncachableResendClient();
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: customer.email,
        replyTo: 'hello@plumbersthatcare.com',
        subject: email.subject,
        html: finalHtmlContent,
        text: finalPlainTextContent || undefined,
        headers: {
          'X-Campaign-ID': campaign.id,
          'X-Campaign-Email-ID': email.id,
          'X-Customer-ID': customer.id.toString(),
        },
        tags: [
          { name: 'campaign_type', value: 'custom' },
          { name: 'campaign_id', value: campaign.id },
        ],
      });

      const resendId = (result as any).data?.id || (result as any).id || '';
      console.log(`[Custom Campaign] Sent email ${email.sequenceNumber} to ${customer.email} (Resend ID: ${resendId})`);

      // Log the send
      await db.insert(customCampaignSendLog).values({
        campaignId: campaign.id,
        campaignEmailId: email.id,
        customerId: customer.id,
        recipientEmail: customer.email,
        recipientName: customer.name,
        sentAt: new Date(),
        resendEmailId: resendId,
        subject: email.subject,
      });

      // Also log in main emailSendLog for unified tracking
      await db.insert(emailSendLog).values({
        email: customer.email,
        campaignType: 'custom_campaign',
        emailNumber: email.sequenceNumber,
        subject: email.subject,
        resendId,
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error(`[Custom Campaign] Error sending email to ${customer.email}:`, error);
      return false;
    }
  }

  /**
   * Process one-time blast campaigns
   */
  private async processOneTimeBlasts() {
    const now = new Date();

    // Find active one-time campaigns without completed status
    const campaigns = await db
      .select()
      .from(customEmailCampaigns)
      .where(
        and(
          eq(customEmailCampaigns.status, 'active'),
          eq(customEmailCampaigns.campaignType, 'one_time'),
          isNull(customEmailCampaigns.completedAt)
        )
      );

    for (const campaign of campaigns) {
      // Check if scheduled time has arrived
      if (campaign.scheduledFor && campaign.scheduledFor > now) {
        continue; // Not yet time to send
      }

      console.log(`[Custom Campaign] Processing one-time blast: ${campaign.name} (ID: ${campaign.id})`);

      // Get campaign emails (should be just one for one-time blasts)
      const emails = await db
        .select()
        .from(customCampaignEmails)
        .where(eq(customCampaignEmails.campaignId, campaign.id))
        .orderBy(customCampaignEmails.sequenceNumber);

      if (emails.length === 0) {
        console.log(`[Custom Campaign] No emails found for campaign ${campaign.id}, skipping`);
        continue;
      }

      if (!campaign.segmentId) {
        console.log(`[Custom Campaign] No segment configured for campaign ${campaign.id}, skipping`);
        continue;
      }

      // Get all segment members
      const members = await db
        .select()
        .from(segmentMembership)
        .where(eq(segmentMembership.segmentId, campaign.segmentId));

      console.log(`[Custom Campaign] Found ${members.length} recipients for campaign ${campaign.id}`);

      let sentCount = 0;
      for (const member of members) {
        const customer = await this.getCustomerDetails(member.customerId);
        if (!customer) {
          console.log(`[Custom Campaign] Customer ${member.customerId} not found or missing email`);
          continue;
        }

        // Check if already sent to this customer
        const alreadySent = await db
          .select()
          .from(customCampaignSendLog)
          .where(
            and(
              eq(customCampaignSendLog.campaignId, campaign.id),
              eq(customCampaignSendLog.customerId, member.customerId)
            )
          )
          .limit(1);

        if (alreadySent.length > 0) {
          continue; // Already sent to this customer
        }

        const success = await this.sendCampaignEmail(
          campaign,
          emails[0], // First (and only) email
          { id: member.customerId, ...customer }
        );

        if (success) {
          sentCount++;
        }

        // Rate limit: small delay between sends
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark campaign as sent
      await db
        .update(customEmailCampaigns)
        .set({
          completedAt: new Date(),
          status: 'completed',
        })
        .where(eq(customEmailCampaigns.id, campaign.id));

      console.log(`[Custom Campaign] Completed one-time blast ${campaign.id}: ${sentCount} emails sent`);
    }
  }

  /**
   * Process drip sequence campaigns
   */
  private async processDripSequences() {
    const now = new Date();

    // Find active drip campaigns
    const campaigns = await db
      .select()
      .from(customEmailCampaigns)
      .where(
        and(
          eq(customEmailCampaigns.status, 'active'),
          eq(customEmailCampaigns.campaignType, 'drip')
        )
      );

    for (const campaign of campaigns) {
      console.log(`[Custom Campaign] Processing drip sequence: ${campaign.name} (ID: ${campaign.id})`);

      // Get all emails in sequence, ordered by daysAfterStart
      const emails = await db
        .select()
        .from(customCampaignEmails)
        .where(eq(customCampaignEmails.campaignId, campaign.id))
        .orderBy(customCampaignEmails.daysAfterStart);

      if (emails.length === 0) {
        console.log(`[Custom Campaign] No emails found for campaign ${campaign.id}, skipping`);
        continue;
      }

      if (!campaign.segmentId) {
        console.log(`[Custom Campaign] No segment configured for campaign ${campaign.id}, skipping`);
        continue;
      }

      // Get all segment members
      const members = await db
        .select()
        .from(segmentMembership)
        .where(eq(segmentMembership.segmentId, campaign.segmentId));

      for (const member of members) {
        const customer = await this.getCustomerDetails(member.customerId);
        if (!customer) {
          continue;
        }

        // Get customer's progress in this campaign
        const sendLogs = await db
          .select()
          .from(customCampaignSendLog)
          .where(
            and(
              eq(customCampaignSendLog.campaignId, campaign.id),
              eq(customCampaignSendLog.customerId, member.customerId)
            )
          )
          .orderBy(desc(customCampaignSendLog.sentAt));

        // Find the first email that hasn't been sent yet
        const nextEmail = emails.find(email => {
          const alreadySent = sendLogs.some(log => log.campaignEmailId === email.id);
          return !alreadySent;
        });

        if (!nextEmail) {
          continue; // Customer has received all emails
        }

        // Check if it's time to send this email
        let referenceDate: Date;
        if (sendLogs.length === 0) {
          // First email: use campaign start date or member join date
          referenceDate = campaign.createdAt;
        } else {
          // Subsequent emails: use last email sent date
          referenceDate = sendLogs[0].sentAt;
        }

        const daysSinceReference = Math.floor(
          (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceReference >= nextEmail.daysAfterStart) {
          console.log(
            `[Custom Campaign] Sending email ${nextEmail.sequenceNumber} to ${customer.email} ` +
            `(${daysSinceReference} days since ${sendLogs.length === 0 ? 'campaign start' : 'last email'})`
          );

          await this.sendCampaignEmail(
            campaign,
            nextEmail,
            { id: member.customerId, ...customer }
          );

          // Rate limit
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  }

  /**
   * Main processing function - runs periodically
   */
  async processCampaigns() {
    try {
      const { allowed, reason } = await this.canSendEmails();
      if (!allowed) {
        console.log(`[Custom Campaign] Skipping: ${reason}`);
        return;
      }

      console.log('[Custom Campaign] Starting campaign processing cycle...');
      
      await this.processOneTimeBlasts();
      await this.processDripSequences();
      
      console.log('[Custom Campaign] Processing cycle complete');
    } catch (error) {
      console.error('[Custom Campaign] Error processing campaigns:', error);
    }
  }
}

// Export singleton instance
export const customCampaignScheduler = new CustomCampaignScheduler();

// Run every 30 minutes
export function startCustomCampaignScheduler() {
  console.log('[Custom Campaign] Scheduler started - will check every 30 minutes');
  
  // Run immediately on startup
  setTimeout(() => {
    customCampaignScheduler.processCampaigns().catch(err => {
      console.error('[Custom Campaign] Error in initial processing:', err);
    });
  }, 5000);

  // Then run every 30 minutes
  setInterval(() => {
    customCampaignScheduler.processCampaigns().catch(err => {
      console.error('[Custom Campaign] Error in scheduled processing:', err);
    });
  }, 30 * 60 * 1000);
}
