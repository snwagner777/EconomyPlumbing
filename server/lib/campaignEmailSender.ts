import { getUncachableResendClient } from '../email';
import {
  renderCampaignEmail,
  getCampaignSubject,
  type CampaignEmailData,
} from '../emails';
import type { IStorage } from '../storage';
import { db } from '../db';
import { campaignSendIdempotency } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface SendCampaignEmailParams {
  to: string;
  campaignData: CampaignEmailData;
  recipientName: string;
  campaignId?: string;
  campaignEmailId?: string;
  serviceTitanCustomerId?: number;
  unsubscribeUrl?: string;
}

export interface CampaignEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class CampaignEmailSender {
  constructor(private storage: IStorage) {}

  async sendCampaignEmail(params: SendCampaignEmailParams): Promise<CampaignEmailResult> {
    const { to, campaignData, recipientName, campaignId, campaignEmailId, serviceTitanCustomerId, unsubscribeUrl } = params;

    try {
      // Check if email is suppressed
      const isSuppressed = await this.storage.isEmailSuppressed(to);
      if (isSuppressed) {
        console.log(`[Campaign Email] Skipping suppressed email: ${to}`);
        return { success: false, error: 'Email is suppressed' };
      }

      // Check email preferences
      const preferences = await this.storage.getEmailPreferencesByEmail(to);
      if (preferences?.unsubscribedAll) {
        console.log(`[Campaign Email] Skipping unsubscribed email: ${to}`);
        return { success: false, error: 'User unsubscribed from all' };
      }

      // Check category-specific preferences (all marketing campaigns use 'marketing' category)
      if (preferences?.unsubscribedMarketing) {
        console.log(`[Campaign Email] User opted out of marketing emails: ${to}`);
        return { success: false, error: 'User opted out of marketing' };
      }

      // Idempotency check: prevent duplicate sends
      if (campaignId && serviceTitanCustomerId) {
        const idempotencyKey = `campaign:${campaignId}:customer:${serviceTitanCustomerId}:type:email`;
        
        const existingSend = await db
          .select()
          .from(campaignSendIdempotency)
          .where(eq(campaignSendIdempotency.idempotencyKey, idempotencyKey))
          .limit(1);

        if (existingSend.length > 0) {
          console.log(
            `[Campaign Email] Duplicate send prevented (idempotency): campaign=${campaignId}, customer=${serviceTitanCustomerId}, email=${to}`
          );
          return { 
            success: true, 
            messageId: existingSend[0].providerMessageId || undefined,
            error: 'Already sent (idempotent)' 
          };
        }
      }

      // Render email HTML from React template
      const html = await renderCampaignEmail(campaignData);
      const subject = getCampaignSubject(campaignData);

      // Add unsubscribe URL to HTML if provided
      let finalHtml = html;
      if (unsubscribeUrl) {
        finalHtml = html.replace(
          'https://economyplumbing.com/unsubscribe',
          unsubscribeUrl
        );
      }

      // Send via Resend
      const { client, fromEmail } = await getUncachableResendClient();
      const result = await client.emails.send({
        from: fromEmail,
        to,
        subject,
        html: finalHtml,
      });

      // Log the send (with proper schema fields - will be available in Tasks 7/12)
      if (campaignId && campaignEmailId && serviceTitanCustomerId) {
        await this.storage.logEmailSend({
          campaignId,
          campaignEmailId,
          serviceTitanCustomerId,
          recipientEmail: to,
          recipientName,
          mergeTagData: campaignData.data, // Full personalization data
          resendEmailId: result.data?.id || null,
          resendStatus: 'sent',
          errorMessage: null,
        });

        // Record in idempotency table to prevent future duplicates
        const idempotencyKey = `campaign:${campaignId}:customer:${serviceTitanCustomerId}:type:email`;
        await db.insert(campaignSendIdempotency).values({
          idempotencyKey,
          campaignType: 'email_campaign',
          campaignId,
          campaignEmailId: campaignEmailId || null,
          serviceTitanCustomerId,
          sendStatus: 'sent',
          providerMessageId: result.data?.id || null,
          sentAt: new Date(),
        });
      }

      console.log(`[Campaign Email] Sent successfully to ${to}:`, result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error: any) {
      console.error(`[Campaign Email] Failed to send to ${to}:`, error);

      // Log failure
      if (campaignId && campaignEmailId && serviceTitanCustomerId) {
        await this.storage.logEmailSend({
          campaignId,
          campaignEmailId,
          serviceTitanCustomerId,
          recipientEmail: to,
          recipientName,
          mergeTagData: campaignData.data,
          resendEmailId: null,
          resendStatus: 'failed',
          errorMessage: error.message,
        });
      }

      return { success: false, error: error.message };
    }
  }

  async batchSendCampaignEmails(
    emails: SendCampaignEmailParams[]
  ): Promise<CampaignEmailResult[]> {
    const results: CampaignEmailResult[] = [];

    for (const emailParams of emails) {
      // Add delay between sends to avoid rate limiting
      if (results.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const result = await this.sendCampaignEmail(emailParams);
      results.push(result);
    }

    return results;
  }
}
