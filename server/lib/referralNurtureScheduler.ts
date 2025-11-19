/**
 * Referral Nurture Campaign Scheduler
 * 
 * Sends 4-email drip campaign over 6 months to encourage referrals:
 * - Email 1: Day 14 after review submission
 * - Email 2: Day 60 
 * - Email 3: Day 150
 * - Email 4: Day 210
 * 
 * Features:
 * - Auto-creates campaigns when customers submit 4+ star reviews
 * - Auto-pauses after 2 consecutive unopened emails
 * - Tracks engagement and referral submissions
 * - Uses database templates or AI generation
 */

import { db } from "../db";
import { 
  referralNurtureCampaigns, 
  reviewEmailTemplates, 
  systemSettings, 
  emailSendLog,
  referralCodes,
  customersXlsx,
  emailSuppressionList
} from "../../shared/schema";
import { eq, and, lt, or } from "drizzle-orm";
import { generateEmail, type GeneratedEmail } from "./aiEmailGenerator";
import { getUncachableResendClient } from '../email';

interface EmailSettings {
  masterEmailEnabled: boolean;
  reviewRequestEnabled: boolean;
  referralNurturePhone: string | null;
}

export class ReferralNurtureScheduler {
  /**
   * Create referral nurture campaign for a happy reviewer (4+ stars)
   */
  async createCampaignForReviewer(customerId: number, customerEmail: string, reviewRequestId: string): Promise<string | null> {
    try {
      // Check if campaign already exists for this customer
      const existing = await db.query.referralNurtureCampaigns.findFirst({
        where: eq(referralNurtureCampaigns.customerId, customerId),
      });

      if (existing) {
        console.log(`[Referral Nurture] Campaign already exists for customer ${customerId}`);
        return existing.id;
      }

      // Create new campaign
      const [campaign] = await db
        .insert(referralNurtureCampaigns)
        .values({
          customerId,
          customerEmail,
          originalReviewId: reviewRequestId,
          status: 'queued',
          createdAt: new Date(),
        })
        .returning();

      console.log(`[Referral Nurture] Created campaign ${campaign.id} for customer ${customerId}`);
      return campaign.id;
    } catch (error) {
      console.error(`[Referral Nurture] Error creating campaign for customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Get email settings from system_settings
   */
  private async getEmailSettings(): Promise<EmailSettings> {
    try {
      const dbSettings = await db.select().from(systemSettings);
      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

      return {
        masterEmailEnabled: settingsMap.get('review_master_email_switch') === 'true',
        reviewRequestEnabled: settingsMap.get('review_drip_enabled') === 'true',
        referralNurturePhone: settingsMap.get('referral_nurture_phone_number') || null,
      };
    } catch (error) {
      console.error("[Referral Nurture] Error fetching settings:", error);
      return {
        masterEmailEnabled: false,
        reviewRequestEnabled: false,
        referralNurturePhone: null,
      };
    }
  }

  /**
   * Check if referral nurture emails can be sent
   */
  private async canSendEmails(): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await this.getEmailSettings();

    if (!settings.masterEmailEnabled) {
      return { allowed: false, reason: 'Email system disabled' };
    }

    if (!settings.reviewRequestEnabled) {
      return { allowed: false, reason: 'Review/referral drip campaigns disabled' };
    }

    if (!settings.referralNurturePhone) {
      return { allowed: false, reason: 'Referral nurture phone number not configured' };
    }

    return { allowed: true };
  }

  /**
   * Get or create referral link for customer
   */
  private async getReferralLink(customerId: number): Promise<string | null> {
    try {
      // Check if customer already has a referral code
      let existingCode = await db.query.referralCodes.findFirst({
        where: eq(referralCodes.customerId, customerId),
      });
      
      // If no code exists, create one using customer ID
      if (!existingCode) {
        const code = customerId.toString(); // Simple format: just customer ID
        
        // Get customer name and phone for the record
        const customer = await db.query.customersXlsx.findFirst({
          where: (customers, { eq }) => eq(customers.id, customerId),
        });
        
        if (!customer) {
          console.error(`[Referral Nurture] Customer ${customerId} not found in customers_xlsx`);
          return null;
        }
        
        // Insert new referral code
        [existingCode] = await db
          .insert(referralCodes)
          .values({
            code,
            customerId,
            customerName: customer.name,
            customerPhone: customer.phone,
            createdAt: new Date(),
          })
          .returning();
      }
      
      // Generate tracking URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plumbersthatcare.com';
      return `${baseUrl}/ref/${existingCode.code}`;
    } catch (error) {
      console.error(`[Referral Nurture] Error generating referral link for customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Inject referral link into email content
   */
  private injectReferralLink(htmlContent: string, plainTextContent: string, referralLink: string): { htmlContent: string; plainTextContent: string } {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plumbersthatcare.com';
    const portalUrl = `${baseUrl}/customer-portal?utm_source=referral_nurture_email&utm_medium=email`;
    
    // HTML injection - add a prominent referral link section before closing </body>
    const htmlReferralSection = `
      <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; border: 2px solid #0ea5e9;">
        <h3 style="margin: 0 0 15px 0; color: #0369a1; font-size: 20px;">🎁 Share & Earn $25</h3>
        <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #334155;">
          Love our service? Share your unique referral link with friends and family. When they book a service, you both get $25!
        </p>
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #cbd5e1;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #64748b;">Your Referral Link:</p>
          <a href="${referralLink}" style="color: #0ea5e9; font-size: 16px; font-weight: 600; text-decoration: none; word-break: break-all;">${referralLink}</a>
        </div>
        <a href="${referralLink}" style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Share Your Link
        </a>
      </div>
    `;
    
    const updatedHtml = htmlContent.includes('</body>') 
      ? htmlContent.replace('</body>', `${htmlReferralSection}</body>`)
      : htmlContent + htmlReferralSection;
    
    // Plain text injection
    const plainReferralSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 SHARE & EARN $25
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Love our service? Share your unique referral link with friends and family. 
When they book a service, you both get $25!

YOUR REFERRAL LINK:
${referralLink}

Copy and share this link via text, email, Facebook, Instagram, or Nextdoor!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    const updatedPlain = plainTextContent + plainReferralSection;
    
    return {
      htmlContent: updatedHtml,
      plainTextContent: updatedPlain,
    };
  }

  /**
   * Get email content for a specific email in the sequence
   */
  private async getEmailContent(
    emailNumber: 1 | 2 | 3 | 4,
    customerData: {
      id: number;
      customerName: string;
      customerEmail: string;
    },
    settings: EmailSettings
  ): Promise<GeneratedEmail> {
    // Generate referral link for this customer FIRST
    const referralLink = await this.getReferralLink(customerData.id);
    if (referralLink) {
      console.log(`[Referral Nurture] Including referral link in email: ${referralLink}`);
    }
    
    // Try to get template from database
    const template = await db.query.reviewEmailTemplates.findFirst({
      where: and(
        eq(reviewEmailTemplates.campaignType, 'referral_nurture'),
        eq(reviewEmailTemplates.emailNumber, emailNumber)
      ),
    });

    if (template) {
      console.log(`[Referral Nurture] Using database template for email ${emailNumber}, injecting referral link`);
      
      // Inject referral link into template
      if (referralLink) {
        const injected = this.injectReferralLink(template.htmlContent, template.plainTextContent, referralLink);
        return {
          subject: template.subject,
          htmlContent: injected.htmlContent,
          plainTextContent: injected.plainTextContent,
        };
      }
      
      return {
        subject: template.subject,
        htmlContent: template.htmlContent,
        plainTextContent: template.plainTextContent,
      };
    }

    // Fall back to AI generation (AI will handle referral link inclusion via prompt)
    console.log(`[Referral Nurture] Generating AI content for email ${emailNumber}`);
    return await generateEmail({
      campaignType: 'referral_nurture',
      emailNumber,
      jobDetails: {
        customerId: customerData.id,
        customerName: customerData.customerName,
      },
      phoneNumber: settings.referralNurturePhone!,
      referralLink: referralLink || undefined,
    });
  }

  /**
   * Send a single referral nurture email
   */
  async sendReferralEmail(campaignId: string, emailNumber: 1 | 2 | 3 | 4): Promise<boolean> {
    try {
      // Get campaign details
      const campaign = await db.query.referralNurtureCampaigns.findFirst({
        where: eq(referralNurtureCampaigns.id, campaignId),
      });

      if (!campaign) {
        console.error(`[Referral Nurture] Campaign ${campaignId} not found`);
        return false;
      }

      // Check if campaign is paused
      if (campaign.status === 'paused') {
        console.log(`[Referral Nurture] Campaign ${campaignId} is paused (${campaign.pauseReason})`);
        return false;
      }

      const settings = await this.getEmailSettings();

      // Check suppression list FIRST (hard bounces, spam complaints)
      const suppressed = await db.query.emailSuppressionList.findFirst({
        where: eq(emailSuppressionList.email, campaign.customerEmail),
      });
      
      if (suppressed) {
        console.log(`[Referral Nurture] Email ${campaign.customerEmail} is suppressed (${suppressed.reason}), pausing campaign`);
        await db
          .update(referralNurtureCampaigns)
          .set({
            status: 'paused',
            pausedAt: new Date(),
            pauseReason: suppressed.reason,
          })
          .where(eq(referralNurtureCampaigns.id, campaignId));
        return false;
      }

      // Check email preferences before sending
      const { canSendEmail, addUnsubscribeFooter, addUnsubscribeFooterPlainText } = await import('./emailPreferenceEnforcer');
      const prefCheck = await canSendEmail(campaign.customerEmail, { type: 'referral' });

      if (!prefCheck.canSend) {
        console.log(`[Referral Nurture] Skipping email - ${prefCheck.reason}`);

        // Pause campaign
        await db
          .update(referralNurtureCampaigns)
          .set({
            status: 'paused',
            pausedAt: new Date(),
            pauseReason: 'opted_out',
          })
          .where(eq(referralNurtureCampaigns.id, campaignId));

        return false;
      }

      // Get email content
      const emailContent = await this.getEmailContent(
        emailNumber,
        {
          id: campaign.customerId,
          customerName: '',
          customerEmail: campaign.customerEmail,
        },
        settings
      );

      // Send email via Resend
      const { client: resend, fromEmail } = await getUncachableResendClient();

      // Add unsubscribe footer to email content
      const htmlWithFooter = addUnsubscribeFooter(emailContent.htmlContent, prefCheck.unsubscribeUrl!);
      const plainWithFooter = addUnsubscribeFooterPlainText(emailContent.plainTextContent, prefCheck.unsubscribeUrl!);

      console.log(`[Referral Nurture] Sending email ${emailNumber} to ${campaign.customerEmail}`);

      const emailResult = await resend.emails.send({
        from: fromEmail,
        to: campaign.customerEmail,
        replyTo: 'hello@mail.plumbersthatcare.com',
        subject: emailContent.subject,
        html: htmlWithFooter,
        text: plainWithFooter,
        headers: {
          'List-Unsubscribe': prefCheck.listUnsubscribeHeader!,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      if (emailResult.error) {
        console.error(`[Referral Nurture] Resend error:`, emailResult.error);
        return false;
      }

      console.log(`[Referral Nurture] Email sent successfully. Resend ID: ${emailResult.data?.id}`);

      // Create emailSendLog record for engagement tracking
      await db.insert(emailSendLog).values({
        campaignType: 'referral_nurture',
        campaignRecordId: campaignId,
        emailNumber,
        recipientEmail: campaign.customerEmail,
        recipientName: '',
        customerId: campaign.customerId,
        resendEmailId: emailResult.data?.id || null,
        resendStatus: 'sent',
      });

      // Update campaign with email sent timestamp
      const updateFields: any = {};

      // Increment consecutive unopened (will be reset to 0 by webhook if they open)
      updateFields.consecutiveUnopened = campaign.consecutiveUnopened + 1;

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
      }

      // Auto-pause if 2 consecutive unopened emails
      if (updateFields.consecutiveUnopened >= 2) {
        updateFields.status = 'paused';
        updateFields.pausedAt = new Date();
        updateFields.pauseReason = 'low_engagement';
        console.log(`[Referral Nurture] Auto-pausing campaign ${campaignId} due to 2 consecutive unopened emails`);
      }

      await db
        .update(referralNurtureCampaigns)
        .set(updateFields)
        .where(eq(referralNurtureCampaigns.id, campaignId));

      console.log(`[Referral Nurture] Successfully sent email ${emailNumber} for campaign ${campaignId}`);
      return true;
    } catch (error) {
      console.error(`[Referral Nurture] Error sending email ${emailNumber} for campaign ${campaignId}:`, error);
      return false;
    }
  }

  /**
   * Process pending referral nurture emails
   */
  async processPendingEmails() {
    try {
      const { allowed, reason } = await this.canSendEmails();
      if (!allowed) {
        console.log(`[Referral Nurture] Skipping email sends: ${reason}`);
        return;
      }

      const now = new Date();

      // Find active campaigns that need emails sent
      const pendingCampaigns = await db
        .select()
        .from(referralNurtureCampaigns)
        .where(
          and(
            or(
              eq(referralNurtureCampaigns.status, 'queued'),
              eq(referralNurtureCampaigns.status, 'email1_sent'),
              eq(referralNurtureCampaigns.status, 'email2_sent'),
              eq(referralNurtureCampaigns.status, 'email3_sent')
            ),
            lt(referralNurtureCampaigns.consecutiveUnopened, 2)
          )
        );

      console.log(`[Referral Nurture] Found ${pendingCampaigns.length} active campaigns`);

      for (const campaign of pendingCampaigns) {
        const daysSinceCreation = Math.floor(
          (now.getTime() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine which email to send based on days since campaign creation
        let emailToSend: 1 | 2 | 3 | 4 | null = null;

        if (daysSinceCreation >= 14 && !campaign.email1SentAt) {
          emailToSend = 1;
        } else if (daysSinceCreation >= 60 && !campaign.email2SentAt) {
          emailToSend = 2;
        } else if (daysSinceCreation >= 150 && !campaign.email3SentAt) {
          emailToSend = 3;
        } else if (daysSinceCreation >= 210 && !campaign.email4SentAt) {
          emailToSend = 4;
        }

        if (emailToSend) {
          console.log(`[Referral Nurture] Sending email ${emailToSend} for campaign ${campaign.id} (${daysSinceCreation} days since creation)`);
          await this.sendReferralEmail(campaign.id, emailToSend);
        }
      }
    } catch (error) {
      console.error("[Referral Nurture] Error processing pending emails:", error);
    }
  }
}

// Export getter function for singleton instance
let instance: ReferralNurtureScheduler | null = null;

export function getReferralNurtureScheduler(): ReferralNurtureScheduler {
  if (!instance) {
    instance = new ReferralNurtureScheduler();
  }
  return instance;
}
