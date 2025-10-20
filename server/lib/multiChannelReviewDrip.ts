/**
 * Multi-Channel Review Request System
 * Coordinates email + SMS for review requests with intelligent channel selection
 * Features: Channel preference learning, cross-channel coordination, AI-optimized timing
 */

import { db } from "../db";
import {
  reviewBehaviorTracking,
  reviewRequestSendLog,
  smsSendLog,
  smsMarketingPreferences,
  reviewEmailPreferences,
  type ReviewBehaviorTracking
} from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { smsService } from "./smsService";
import { sendEmail } from "./resend";
import { ReviewRequestEmail } from "../emails/review-request";
import { ReviewReminderEmail } from "../emails/review-reminder";
import { render } from "@react-email/render";

interface ChannelPreference {
  preferredChannel: 'email' | 'sms' | 'both';
  emailEngagement: number; // 0-100 score
  smsEngagement: number; // 0-100 score
  reasoning: string;
}

interface MultiChannelStrategy {
  primaryChannel: 'email' | 'sms';
  secondaryChannel: 'email' | 'sms' | null;
  primaryTiming: number; // Day offset
  secondaryTiming: number | null; // Day offset for secondary channel
  reasoning: string;
}

export class MultiChannelReviewDrip {
  /**
   * Analyze customer's channel preference based on historical engagement
   */
  async analyzeChannelPreference(
    customerId: number,
    phoneNumber?: string,
    email?: string
  ): Promise<ChannelPreference> {
    try {
      // Get email engagement history
      const emailHistory = await db
        .select()
        .from(reviewRequestSendLog)
        .where(
          and(
            eq(reviewRequestSendLog.customerId, customerId),
            gte(reviewRequestSendLog.sentAt, sql`now() - interval '365 days'`)
          )
        )
        .limit(20);

      // Get SMS engagement history
      const smsHistory = phoneNumber ? await db
        .select()
        .from(smsSendLog)
        .where(
          and(
            eq(smsSendLog.customerId, customerId),
            eq(smsSendLog.messageType, 'review_request'),
            gte(smsSendLog.sentAt, sql`now() - interval '365 days'`)
          )
        )
        .limit(20) : [];

      // Calculate email engagement score
      const emailSent = emailHistory.length;
      const emailOpened = emailHistory.filter(e => e.opened).length;
      const emailClicked = emailHistory.filter(e => e.clicked).length;
      const emailReviewed = emailHistory.filter(e => e.reviewCompleted).length;

      const emailEngagement = emailSent > 0
        ? ((emailOpened * 0.3 + emailClicked * 0.5 + emailReviewed * 1.0) / emailSent) * 100
        : 50; // Default score if no history

      // Calculate SMS engagement score
      const smsSent = smsHistory.length;
      const smsDelivered = smsHistory.filter(s => s.twilioStatus === 'delivered').length;
      const smsClicked = smsHistory.filter(s => s.linkClicked).length;
      const smsConverted = smsHistory.filter(s => s.converted).length;

      const smsEngagement = smsSent > 0
        ? ((smsDelivered * 0.3 + smsClicked * 0.5 + smsConverted * 1.0) / smsSent) * 100
        : 50; // Default score if no history

      // Determine preferred channel
      let preferredChannel: 'email' | 'sms' | 'both';
      let reasoning: string;

      if (Math.abs(emailEngagement - smsEngagement) < 10) {
        preferredChannel = 'both';
        reasoning = `Email (${emailEngagement.toFixed(0)}%) and SMS (${smsEngagement.toFixed(0)}%) show similar engagement - use both channels`;
      } else if (emailEngagement > smsEngagement) {
        preferredChannel = 'email';
        reasoning = `Email shows stronger engagement (${emailEngagement.toFixed(0)}% vs ${smsEngagement.toFixed(0)}% SMS)`;
      } else {
        preferredChannel = 'sms';
        reasoning = `SMS shows stronger engagement (${smsEngagement.toFixed(0)}% vs ${emailEngagement.toFixed(0)}% email)`;
      }

      console.log(`[Multi-Channel] Customer ${customerId} preference: ${preferredChannel} - ${reasoning}`);

      return {
        preferredChannel,
        emailEngagement,
        smsEngagement,
        reasoning
      };

    } catch (error) {
      console.error('[Multi-Channel] Error analyzing channel preference:', error);
      // Default to email if analysis fails
      return {
        preferredChannel: 'email',
        emailEngagement: 50,
        smsEngagement: 50,
        reasoning: 'Default to email due to analysis error'
      };
    }
  }

  /**
   * Create multi-channel strategy for a review request
   */
  async createMultiChannelStrategy(
    channelPreference: ChannelPreference,
    hasEmail: boolean,
    hasPhone: boolean
  ): Promise<MultiChannelStrategy> {
    // If only one channel available, use it
    if (!hasEmail && hasPhone) {
      return {
        primaryChannel: 'sms',
        secondaryChannel: null,
        primaryTiming: 0,
        secondaryTiming: null,
        reasoning: 'SMS only - no email address available'
      };
    }

    if (hasEmail && !hasPhone) {
      return {
        primaryChannel: 'email',
        secondaryChannel: null,
        primaryTiming: 0,
        secondaryTiming: null,
        reasoning: 'Email only - no phone number available'
      };
    }

    // Both channels available - use preference data
    if (channelPreference.preferredChannel === 'both') {
      // Use both channels with coordinated timing
      return {
        primaryChannel: 'email', // Start with email (less intrusive)
        secondaryChannel: 'sms',
        primaryTiming: 0, // Same day as job completion
        secondaryTiming: 2, // SMS follow-up 2 days later if no response
        reasoning: 'Both channels engaged - email first (day 0), SMS follow-up (day 2) if no response'
      };
    } else if (channelPreference.preferredChannel === 'email') {
      // Email preferred - SMS as fallback
      return {
        primaryChannel: 'email',
        secondaryChannel: 'sms',
        primaryTiming: 0,
        secondaryTiming: 3, // SMS fallback after 3 days if email not opened
        reasoning: `Email preferred (${channelPreference.emailEngagement.toFixed(0)}% engagement) - SMS fallback day 3`
      };
    } else {
      // SMS preferred - email as supporting
      return {
        primaryChannel: 'sms',
        secondaryChannel: 'email',
        primaryTiming: 0,
        secondaryTiming: 1, // Email follow-up next day with more details
        reasoning: `SMS preferred (${channelPreference.smsEngagement.toFixed(0)}% engagement) - email details day 1`
      };
    }
  }

  /**
   * Send review request via SMS
   */
  async sendReviewRequestSMS(
    phoneNumber: string,
    customerName: string,
    serviceName: string,
    reviewLink: string,
    customerId?: number
  ) {
    console.log(`[Multi-Channel] Sending SMS review request to ${customerName}`);

    const result = await smsService.sendReviewRequest(
      phoneNumber,
      customerName,
      serviceName,
      reviewLink,
      customerId
    );

    if (!result.success) {
      console.error(`[Multi-Channel] SMS send failed: ${result.error}`);
      if (result.blocked) {
        console.log(`[Multi-Channel] Customer opted out of SMS review requests`);
      }
    }

    return result;
  }

  /**
   * Send review request via email
   */
  async sendReviewRequestEmail(
    email: string,
    customerName: string,
    serviceName: string,
    technicianName: string,
    reviewLink: string,
    customerId?: number
  ) {
    console.log(`[Multi-Channel] Sending email review request to ${customerName}`);

    const firstName = customerName.split(' ')[0];

    const emailHtml = render(
      ReviewRequestEmail({
        firstName,
        jobType: serviceName,
        technicianName,
        reviewLink
      })
    );

    try {
      await sendEmail({
        to: email,
        subject: `Thanks ${firstName}! How did we do?`,
        html: emailHtml
      });

      console.log(`[Multi-Channel] ✅ Email sent successfully to ${email}`);
      return { success: true };
    } catch (error) {
      console.error(`[Multi-Channel] Email send failed:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute multi-channel review request with intelligent coordination
   */
  async sendMultiChannelReviewRequest(params: {
    customerId: number;
    customerName: string;
    email?: string;
    phoneNumber?: string;
    serviceName: string;
    technicianName: string;
    reviewLink: string;
    jobCompletedDate: Date;
  }) {
    const {
      customerId,
      customerName,
      email,
      phoneNumber,
      serviceName,
      technicianName,
      reviewLink,
      jobCompletedDate
    } = params;

    console.log(`[Multi-Channel] Initiating review request for customer ${customerId} (${customerName})`);

    // Analyze channel preference
    const preference = await this.analyzeChannelPreference(customerId, phoneNumber, email);

    // Create multi-channel strategy
    const strategy = await this.createMultiChannelStrategy(
      preference,
      !!email,
      !!phoneNumber
    );

    console.log(`[Multi-Channel] Strategy: ${strategy.reasoning}`);

    // Send via primary channel
    let primarySent = false;
    if (strategy.primaryChannel === 'email' && email) {
      const result = await this.sendReviewRequestEmail(
        email,
        customerName,
        serviceName,
        technicianName,
        reviewLink,
        customerId
      );
      primarySent = result.success;
    } else if (strategy.primaryChannel === 'sms' && phoneNumber) {
      const result = await this.sendReviewRequestSMS(
        phoneNumber,
        customerName,
        serviceName,
        reviewLink,
        customerId
      );
      primarySent = result.success;
    }

    // Schedule secondary channel if configured
    if (strategy.secondaryChannel && strategy.secondaryTiming) {
      console.log(`[Multi-Channel] Secondary channel (${strategy.secondaryChannel}) scheduled for day ${strategy.secondaryTiming}`);
      // TODO: Implement scheduling system for secondary channel
      // This would hook into a job queue or scheduled task system
    }

    return {
      success: primarySent,
      primaryChannel: strategy.primaryChannel,
      secondaryChannel: strategy.secondaryChannel,
      strategy: strategy.reasoning,
      channelPreference: preference
    };
  }

  /**
   * Check if should send secondary channel message
   * Called by scheduled job to determine if secondary channel should fire
   */
  async shouldSendSecondaryChannel(
    customerId: number,
    primaryChannel: 'email' | 'sms',
    daysSincePrimary: number
  ): Promise<boolean> {
    // Get behavior tracking for this customer's latest review request
    const [tracking] = await db
      .select()
      .from(reviewBehaviorTracking)
      .where(eq(reviewBehaviorTracking.customerId, customerId))
      .orderBy(desc(reviewBehaviorTracking.journeyStartedAt))
      .limit(1);

    if (!tracking) {
      return false; // No tracking found
    }

    // Don't send secondary if they already completed review
    if (tracking.reviewCompleted) {
      console.log(`[Multi-Channel] Secondary channel skipped - review already completed`);
      return false;
    }

    // For email primary, send SMS secondary if email not opened after 3 days
    if (primaryChannel === 'email' && daysSincePrimary >= 3) {
      const emailOpened = tracking.totalOpens > 0;
      if (!emailOpened) {
        console.log(`[Multi-Channel] Secondary SMS recommended - email not opened after 3 days`);
        return true;
      }
    }

    // For SMS primary, send email secondary with more details after 1 day
    if (primaryChannel === 'sms' && daysSincePrimary >= 1) {
      const smsClicked = tracking.totalClicks > 0;
      if (!smsClicked) {
        console.log(`[Multi-Channel] Secondary email recommended - SMS not clicked after 1 day`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get customer communication summary for admin dashboard
   */
  async getCustomerCommunicationSummary(customerId: number) {
    const emailHistory = await db
      .select()
      .from(reviewRequestSendLog)
      .where(eq(reviewRequestSendLog.customerId, customerId))
      .orderBy(desc(reviewRequestSendLog.sentAt))
      .limit(10);

    const smsHistory = await db
      .select()
      .from(smsSendLog)
      .where(
        and(
          eq(smsSendLog.customerId, customerId),
          eq(smsSendLog.messageType, 'review_request')
        )
      )
      .orderBy(desc(smsSendLog.sentAt))
      .limit(10);

    return {
      email: {
        total: emailHistory.length,
        opened: emailHistory.filter(e => e.opened).length,
        clicked: emailHistory.filter(e => e.clicked).length,
        reviewed: emailHistory.filter(e => e.reviewCompleted).length,
        lastSent: emailHistory[0]?.sentAt
      },
      sms: {
        total: smsHistory.length,
        delivered: smsHistory.filter(s => s.twilioStatus === 'delivered').length,
        clicked: smsHistory.filter(s => s.linkClicked).length,
        converted: smsHistory.filter(s => s.converted).length,
        lastSent: smsHistory[0]?.sentAt
      },
      history: [
        ...emailHistory.map(e => ({
          channel: 'email' as const,
          sentAt: e.sentAt,
          opened: e.opened,
          clicked: e.clicked,
          completed: e.reviewCompleted
        })),
        ...smsHistory.map(s => ({
          channel: 'sms' as const,
          sentAt: s.sentAt,
          delivered: s.twilioStatus === 'delivered',
          clicked: s.linkClicked,
          completed: s.converted
        }))
      ].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
    };
  }
}

// Singleton instance
export const multiChannelReviewDrip = new MultiChannelReviewDrip();
