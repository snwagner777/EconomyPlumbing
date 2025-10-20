/**
 * Unified SMS Service Layer
 * Handles all SMS sending across the platform: review requests, marketing campaigns, referrals, transactional
 * Features: TCPA compliance, opt-in/opt-out checking, delivery tracking, cost tracking, template system
 */

import { db } from "../db";
import {
  smsMarketingPreferences,
  smsSendLog,
  smsKeywords,
  reputationSystemSettings,
  type InsertSMSSendLog,
  type SMSMarketingPreferences,
  type SMSKeyword
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendSMS as twilioSendSMS } from "./sms";

// SMS cost per message (Twilio: ~$0.0075 per segment)
const SMS_COST_PER_SEGMENT = 0.0075;

// Character limits
const SMS_SEGMENT_LENGTH = 160;
const SMS_UNICODE_SEGMENT_LENGTH = 70; // For messages with unicode characters

interface SMSTemplate {
  name: string;
  body: string;
  variables: string[]; // e.g., ['firstName', 'serviceName', 'reviewLink']
}

// Predefined SMS templates
const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  review_request: {
    name: "Review Request",
    body: "Hi {firstName}! Thanks for choosing Economy Plumbing. How was your {serviceName} service? Share your feedback: {reviewLink}\n\nReply STOP to unsubscribe",
    variables: ['firstName', 'serviceName', 'reviewLink']
  },
  review_reminder: {
    name: "Review Reminder",
    body: "Hi {firstName}! We'd love to hear about your recent {serviceName} experience. Leave a quick review: {reviewLink}\n\nReply STOP to opt out",
    variables: ['firstName', 'serviceName', 'reviewLink']
  },
  referral_notification: {
    name: "Referral Notification",
    body: "{referrerName} thinks you could use Economy Plumbing! Get $25 off your first service of $200+. Schedule now: {referralLink}",
    variables: ['referrerName', 'referralLink']
  },
  promotional_offer: {
    name: "Promotional Offer",
    body: "🔧 Special Offer! {offerDetails}\n\nBook now: {bookingLink}\nExpires: {expiryDate}\n\nReply STOP to unsubscribe",
    variables: ['offerDetails', 'bookingLink', 'expiryDate']
  },
  vip_exclusive: {
    name: "VIP Exclusive",
    body: "VIP EXCLUSIVE: {offerDetails}\n\n{ctaText}: {ctaLink}\n\nYour VIP code: {vipCode}\n\nReply STOP to opt out",
    variables: ['offerDetails', 'ctaText', 'ctaLink', 'vipCode']
  },
  appointment_reminder: {
    name: "Appointment Reminder",
    body: "Reminder: Your {serviceName} appointment is {appointmentDate} at {appointmentTime}. We'll call when we're on our way!\n\nEconomy Plumbing\n(512) 758-8956",
    variables: ['serviceName', 'appointmentDate', 'appointmentTime']
  }
};

interface SendSMSOptions {
  phoneNumber: string;
  messageBody: string;
  messageType: 'marketing' | 'review_request' | 'appointment_reminder' | 'referral' | 'transactional';
  customerId?: number;
  customerName?: string;
  campaignId?: string;
  messageId?: string;
  checkOptIn?: boolean; // Whether to check marketing opt-in status (default: true for marketing)
}

interface SMSSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  blocked?: boolean; // Whether message was blocked due to opt-out
  cost?: number; // In cents
}

export class SMSService {
  /**
   * Check if a phone number is opted in for SMS marketing
   */
  private async checkOptInStatus(
    phoneNumber: string,
    messageType: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const normalized = this.normalizePhoneNumber(phoneNumber);
      
      const [prefs] = await db
        .select()
        .from(smsMarketingPreferences)
        .where(eq(smsMarketingPreferences.phoneNumber, normalized))
        .limit(1);

      if (!prefs) {
        // No preference record - default deny for marketing, allow for transactional
        if (messageType === 'marketing' || messageType === 'review_request') {
          return { allowed: false, reason: 'No opt-in record found' };
        }
        return { allowed: true }; // Transactional messages don't require opt-in
      }

      // Check if opted out globally
      if (prefs.optedOut) {
        return { allowed: false, reason: 'User opted out globally' };
      }

      // Check message type specific preferences
      switch (messageType) {
        case 'marketing':
          if (!prefs.optedIn || !prefs.allowPromotional) {
            return { allowed: false, reason: 'Not opted in for promotional messages' };
          }
          break;
        case 'review_request':
          if (!prefs.allowReviewRequests) {
            return { allowed: false, reason: 'Not opted in for review requests' };
          }
          break;
        case 'appointment_reminder':
        case 'transactional':
          if (!prefs.allowTransactional) {
            return { allowed: false, reason: 'Not opted in for transactional messages' };
          }
          break;
      }

      return { allowed: true };
    } catch (error) {
      console.error('[SMSService] Error checking opt-in status:', error);
      // Fail safe: block marketing messages if we can't verify opt-in
      if (messageType === 'marketing') {
        return { allowed: false, reason: 'Error verifying opt-in status' };
      }
      return { allowed: true };
    }
  }

  /**
   * Normalize phone number to E.164 format (+1XXXXXXXXXX)
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    return phone; // Return original if can't normalize
  }

  /**
   * Calculate SMS segment count
   */
  private calculateSegmentCount(message: string): number {
    // Check for unicode characters
    const hasUnicode = /[^\x00-\x7F]/.test(message);
    const segmentLength = hasUnicode ? SMS_UNICODE_SEGMENT_LENGTH : SMS_SEGMENT_LENGTH;
    
    return Math.ceil(message.length / segmentLength);
  }

  /**
   * Calculate cost in cents
   */
  private calculateCost(segmentCount: number): number {
    return Math.round(segmentCount * SMS_COST_PER_SEGMENT * 100); // Convert to cents
  }

  /**
   * Render SMS template with variables
   */
  public renderTemplate(templateName: string, variables: Record<string, string>): string {
    const template = SMS_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`SMS template '${templateName}' not found`);
    }

    let rendered = template.body;
    
    // Replace all variables
    for (const varName of template.variables) {
      const value = variables[varName];
      if (value !== undefined) {
        rendered = rendered.replace(new RegExp(`\\{${varName}\\}`, 'g'), value);
      }
    }

    return rendered;
  }

  /**
   * Check reputation system master switch
   */
  private async checkReputationMasterSwitch(): Promise<boolean> {
    try {
      const [setting] = await db
        .select()
        .from(reputationSystemSettings)
        .where(eq(reputationSystemSettings.settingKey, 'master_switch'))
        .limit(1);

      if (!setting) {
        return false; // Default OFF if not configured
      }

      const value = setting.settingValue as { enabled: boolean };
      return value.enabled === true;
    } catch (error) {
      console.error('[SMSService] Error checking reputation master switch:', error);
      return false; // Fail safe: OFF
    }
  }

  /**
   * Main method to send SMS
   */
  async sendSMS(options: SendSMSOptions): Promise<SMSSendResult> {
    const {
      phoneNumber,
      messageBody,
      messageType,
      customerId,
      customerName,
      campaignId,
      messageId,
      checkOptIn = messageType === 'marketing' // Default: check opt-in for marketing
    } = options;

    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // For review requests, check reputation system master switch
      if (messageType === 'review_request') {
        const masterEnabled = await this.checkReputationMasterSwitch();
        if (!masterEnabled) {
          console.log('[SMSService] Review request blocked - reputation master switch is OFF');
          return {
            success: false,
            blocked: true,
            error: 'Reputation system master switch is disabled'
          };
        }
      }

      // Check opt-in status if required
      if (checkOptIn) {
        const optInCheck = await this.checkOptInStatus(normalizedPhone, messageType);
        if (!optInCheck.allowed) {
          console.log(`[SMSService] SMS blocked for ${normalizedPhone}: ${optInCheck.reason}`);
          return {
            success: false,
            blocked: true,
            error: optInCheck.reason
          };
        }
      }

      // Calculate segments and cost
      const characterCount = messageBody.length;
      const segmentCount = this.calculateSegmentCount(messageBody);
      const cost = this.calculateCost(segmentCount);

      console.log(`[SMSService] Sending ${messageType} SMS to ${normalizedPhone} (${segmentCount} segments, $${(cost / 100).toFixed(4)})`);

      // Send via Twilio
      await twilioSendSMS({
        to: normalizedPhone,
        message: messageBody
      });

      // Log to database (assume success - Twilio doesn't return SID in our current implementation)
      const twilioSid = `mock_${Date.now()}`; // In production, extract from Twilio response

      await db.insert(smsSendLog).values({
        campaignId,
        messageId,
        messageType,
        phoneNumber: normalizedPhone,
        customerId,
        customerName,
        messageBody,
        characterCount,
        segmentCount,
        twilioSid,
        twilioStatus: 'sent',
        cost
      });

      // Update SMS preferences activity
      if (checkOptIn) {
        await db
          .update(smsMarketingPreferences)
          .set({
            lastMessageSentAt: new Date(),
            totalMessagesSent: sql`${smsMarketingPreferences.totalMessagesSent} + 1`,
            lastUpdatedAt: new Date()
          })
          .where(eq(smsMarketingPreferences.phoneNumber, normalizedPhone));
      }

      return {
        success: true,
        messageSid: twilioSid,
        cost
      };

    } catch (error) {
      console.error('[SMSService] Error sending SMS:', error);
      
      // Log failed attempt to database
      try {
        await db.insert(smsSendLog).values({
          campaignId,
          messageId,
          messageType,
          phoneNumber: this.normalizePhoneNumber(phoneNumber),
          customerId,
          customerName,
          messageBody,
          characterCount: messageBody.length,
          segmentCount: this.calculateSegmentCount(messageBody),
          twilioStatus: 'failed',
          twilioErrorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date()
        });
      } catch (logError) {
        console.error('[SMSService] Failed to log error to database:', logError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send review request SMS
   */
  async sendReviewRequest(
    phoneNumber: string,
    customerName: string,
    serviceName: string,
    reviewLink: string,
    customerId?: number
  ): Promise<SMSSendResult> {
    const firstName = customerName.split(' ')[0];
    const messageBody = this.renderTemplate('review_request', {
      firstName,
      serviceName,
      reviewLink
    });

    return this.sendSMS({
      phoneNumber,
      messageBody,
      messageType: 'review_request',
      customerId,
      customerName,
      checkOptIn: true // Check review request opt-in
    });
  }

  /**
   * Send referral notification SMS
   */
  async sendReferralNotification(
    phoneNumber: string,
    referrerName: string,
    referralLink: string
  ): Promise<SMSSendResult> {
    const messageBody = this.renderTemplate('referral_notification', {
      referrerName: referrerName.split(' ')[0], // First name only
      referralLink
    });

    return this.sendSMS({
      phoneNumber,
      messageBody,
      messageType: 'referral',
      checkOptIn: false // Referrals are transactional
    });
  }

  /**
   * Send marketing campaign SMS
   */
  async sendCampaignMessage(
    phoneNumber: string,
    messageBody: string,
    campaignId: string,
    messageId?: string,
    customerId?: number,
    customerName?: string
  ): Promise<SMSSendResult> {
    return this.sendSMS({
      phoneNumber,
      messageBody,
      messageType: 'marketing',
      customerId,
      customerName,
      campaignId,
      messageId,
      checkOptIn: true // Always check opt-in for marketing
    });
  }

  /**
   * Process incoming SMS (opt-out keywords, auto-responses)
   */
  async processIncomingSMS(from: string, body: string): Promise<void> {
    const normalizedPhone = this.normalizePhoneNumber(from);
    const keyword = body.trim().toUpperCase();

    console.log(`[SMSService] Processing incoming SMS from ${normalizedPhone}: "${keyword}"`);

    // Check if it's a registered keyword
    const [keywordRecord] = await db
      .select()
      .from(smsKeywords)
      .where(and(
        eq(smsKeywords.keyword, keyword),
        eq(smsKeywords.isActive, true)
      ))
      .limit(1);

    if (keywordRecord) {
      // Update usage count
      await db
        .update(smsKeywords)
        .set({
          usageCount: sql`${smsKeywords.usageCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(smsKeywords.id, keywordRecord.id));

      // Execute action
      if (keywordRecord.action === 'opt_out') {
        await this.optOut(normalizedPhone, 'STOP_keyword');
      } else if (keywordRecord.action === 'opt_in') {
        await this.optIn(normalizedPhone, 'keyword');
      }

      // Send auto-response
      if (keywordRecord.responseMessage) {
        await twilioSendSMS({
          to: normalizedPhone,
          message: keywordRecord.responseMessage
        });
      }
    } else {
      console.log(`[SMSService] Unknown keyword: ${keyword}`);
    }
  }

  /**
   * Opt-in a phone number for SMS marketing
   */
  async optIn(
    phoneNumber: string,
    source: string,
    customerId?: number,
    customerName?: string,
    email?: string,
    ipAddress?: string
  ): Promise<void> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Check if record exists
    const [existing] = await db
      .select()
      .from(smsMarketingPreferences)
      .where(eq(smsMarketingPreferences.phoneNumber, normalizedPhone))
      .limit(1);

    if (existing) {
      // Update existing record
      await db
        .update(smsMarketingPreferences)
        .set({
          optedIn: true,
          optInSource: source,
          optInDate: new Date(),
          optInIpAddress: ipAddress,
          optedOut: false, // Clear opt-out if previously opted out
          optOutDate: null,
          optOutMethod: null,
          customerId: customerId || existing.customerId,
          customerName: customerName || existing.customerName,
          email: email || existing.email,
          lastUpdatedAt: new Date()
        })
        .where(eq(smsMarketingPreferences.id, existing.id));
      
      console.log(`[SMSService] ✅ Updated opt-in for ${normalizedPhone}`);
    } else {
      // Create new record
      await db.insert(smsMarketingPreferences).values({
        phoneNumber: normalizedPhone,
        customerId,
        customerName,
        email,
        optedIn: true,
        optInSource: source,
        optInDate: new Date(),
        optInIpAddress: ipAddress,
        allowPromotional: true,
        allowTransactional: true,
        allowReviewRequests: true
      });
      
      console.log(`[SMSService] ✅ Created new opt-in for ${normalizedPhone}`);
    }
  }

  /**
   * Opt-out a phone number from SMS marketing
   */
  async optOut(phoneNumber: string, method: string): Promise<void> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Check if record exists
    const [existing] = await db
      .select()
      .from(smsMarketingPreferences)
      .where(eq(smsMarketingPreferences.phoneNumber, normalizedPhone))
      .limit(1);

    if (existing) {
      // Update existing record
      await db
        .update(smsMarketingPreferences)
        .set({
          optedOut: true,
          optOutDate: new Date(),
          optOutMethod: method,
          optedIn: false, // Clear opt-in
          lastUpdatedAt: new Date()
        })
        .where(eq(smsMarketingPreferences.id, existing.id));
      
      console.log(`[SMSService] ❌ Opted out ${normalizedPhone} (method: ${method})`);
    } else {
      // Create opt-out record
      await db.insert(smsMarketingPreferences).values({
        phoneNumber: normalizedPhone,
        optedOut: true,
        optOutDate: new Date(),
        optOutMethod: method,
        optedIn: false,
        allowPromotional: false,
        allowTransactional: false,
        allowReviewRequests: false
      });
      
      console.log(`[SMSService] ❌ Created opt-out record for ${normalizedPhone}`);
    }
  }

  /**
   * Get SMS statistics for a campaign
   */
  async getCampaignStats(campaignId: string) {
    const logs = await db
      .select()
      .from(smsSendLog)
      .where(eq(smsSendLog.campaignId, campaignId));

    return {
      total: logs.length,
      sent: logs.filter(l => l.twilioStatus === 'sent' || l.twilioStatus === 'delivered').length,
      delivered: logs.filter(l => l.twilioStatus === 'delivered').length,
      failed: logs.filter(l => l.twilioStatus === 'failed').length,
      clicked: logs.filter(l => l.linkClicked).length,
      converted: logs.filter(l => l.converted).length,
      totalCost: logs.reduce((sum, l) => sum + (l.cost || 0), 0), // In cents
      avgSegments: logs.length > 0 
        ? logs.reduce((sum, l) => sum + l.segmentCount, 0) / logs.length 
        : 0
    };
  }
}

// Singleton instance
export const smsService = new SMSService();
