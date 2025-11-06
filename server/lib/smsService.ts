/**
 * Unified SMS Service Layer
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 * This service handled:
 * - SMS sending across the platform
 * - Review requests, marketing campaigns, referrals, transactional messages
 * - TCPA compliance, opt-in/opt-out checking
 * - Delivery tracking, cost tracking, template system
 * 
 * CRITICAL REQUIREMENT (as of Nov 6, 2025):
 * - NEVER send marketing/promotional SMS to users who have NOT explicitly opted in via checkbox
 * - Users must check the A2P consent checkbox with required verbiage before receiving ANY promotional messages
 * - EXCEPTION: 2FA/authentication messages and transactional messages (review requests) do NOT require opt-in
 * - Opt-in consent is stored in contactSubmissions.smsConsent field
 * - When rebuilding this service, ensure checkOptIn is TRUE for all marketing messageTypes
 */

import { sendSMS as twilioSendSMS } from "./sms";

interface SMSSendResult {
  success: boolean;
  messageSid?: string;
  cost?: number;
  blocked?: boolean;
  error?: string;
}

interface SendSMSOptions {
  phoneNumber: string;
  messageBody: string;
  messageType: 'marketing' | 'review_request' | 'appointment_reminder' | 'referral' | 'transactional';
  customerId?: number;
  customerName?: string;
  campaignId?: string;
  messageId?: string;
  checkOptIn?: boolean;
}

export class SMSService {
  /**
   * Main method to send SMS
   * TEMPORARILY SIMPLIFIED - will be rebuilt with full functionality
   */
  async sendSMS(options: SendSMSOptions): Promise<SMSSendResult> {
    const {
      phoneNumber,
      messageBody,
      messageType,
    } = options;

    try {
      // For now, just send SMS without any database tracking or opt-in checking
      console.log(`[SMSService] Sending ${messageType} SMS to ${phoneNumber} (simplified mode)`);
      
      await twilioSendSMS({
        to: phoneNumber,
        message: messageBody
      });

      return {
        success: true,
        messageSid: `temp_${Date.now()}`,
        cost: 0
      };
    } catch (error) {
      console.error('[SMSService] Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process incoming SMS (opt-out keywords, auto-responses)
   * TEMPORARILY SIMPLIFIED - will be rebuilt
   */
  async processIncomingSMS(from: string, body: string): Promise<void> {
    const keyword = body.trim().toUpperCase();
    console.log(`[SMSService] Processing incoming SMS from ${from}: "${keyword}"`);

    // For now, just handle basic STOP/START keywords
    if (keyword === 'STOP' || keyword === 'UNSUBSCRIBE' || keyword === 'CANCEL') {
      await twilioSendSMS({
        to: from,
        message: "You have been unsubscribed from SMS messages. Reply START to resubscribe."
      });
    } else if (keyword === 'START' || keyword === 'SUBSCRIBE') {
      await twilioSendSMS({
        to: from,
        message: "Welcome! You're now subscribed to SMS updates from Economy Plumbing."
      });
    }
  }

  /**
   * Opt-in a phone number for SMS marketing
   * TEMPORARILY DISABLED
   */
  async optIn(
    phoneNumber: string,
    source: string,
    customerId?: number,
    customerName?: string,
    email?: string,
    ipAddress?: string
  ): Promise<void> {
    console.log(`[SMSService] Opt-in temporarily disabled for ${phoneNumber}`);
    // Will be rebuilt when smsMarketingPreferences table is restored
  }

  /**
   * Opt-out a phone number from SMS marketing
   * TEMPORARILY DISABLED
   */
  async optOut(phoneNumber: string, source: string): Promise<void> {
    console.log(`[SMSService] Opt-out temporarily disabled for ${phoneNumber}`);
    // Will be rebuilt when smsMarketingPreferences table is restored
  }

  /**
   * Check if a phone number is opted in
   * TEMPORARILY RETURNS FALSE
   */
  async isOptedIn(phoneNumber: string): Promise<boolean> {
    // Temporarily return false for all numbers until marketing tables are restored
    return false;
  }

  /**
   * Get SMS statistics
   * TEMPORARILY RETURNS EMPTY DATA
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalCost: 0,
      optInCount: 0,
      optOutCount: 0
    };
  }

  /**
   * Send review request SMS
   * TEMPORARILY SIMPLIFIED
   */
  async sendReviewRequest(
    phoneNumber: string,
    customerName: string,
    serviceName: string,
    reviewLink: string,
    customerId?: number
  ): Promise<SMSSendResult> {
    const messageBody = `Hi ${customerName}! Thanks for choosing Economy Plumbing. How was your ${serviceName} service? Share your feedback: ${reviewLink}\n\nReply STOP to unsubscribe`;
    
    return this.sendSMS({
      phoneNumber,
      messageBody,
      messageType: 'review_request',
      customerId,
      customerName,
      checkOptIn: false
    });
  }

  /**
   * Send marketing campaign SMS
   * TEMPORARILY SIMPLIFIED
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
      checkOptIn: false // Temporarily disabled
    });
  }

  /**
   * Render SMS template with variables
   * SIMPLIFIED VERSION
   */
  public renderTemplate(templateName: string, variables: Record<string, string>): string {
    // Simplified template rendering
    let template = `Template: ${templateName}`;
    for (const [key, value] of Object.entries(variables)) {
      template = template.replace(`{${key}}`, value);
    }
    return template;
  }
}

// Create and export singleton instance
export const smsService = new SMSService();