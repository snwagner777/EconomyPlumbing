/**
 * AI-Powered SMS Campaign Generation System
 * Mirrors email marketing automation but for SMS delivery
 * Features: Cross-channel awareness, intelligent timing, AI-generated content, multi-channel coordination
 */

import OpenAI from "openai";
import { db } from "../db";
import {
  smsCampaigns,
  smsCampaignMessages,
  customerSegments,
  segmentMembership,
  emailCampaigns,
  campaignEmails,
  emailSendLog,
  smsSendLog,
  type InsertSMSCampaign,
  type InsertSMSCampaignMessage,
  type CustomerSegment,
  type EmailCampaign
} from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CampaignContext {
  businessType: 'plumbing';
  seasonalContext?: string; // 'winter', 'spring', 'summer', 'fall'
  recentEmailCampaigns?: EmailCampaign[]; // Recent email campaigns to avoid duplication
  targetSegment?: CustomerSegment;
  campaignGoal: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'referral';
  offerType?: 'discount' | 'seasonal' | 'vip_exclusive' | 'referral_bonus' | 'maintenance_reminder';
}

interface SMSCampaignSuggestion {
  campaignName: string;
  description: string;
  targetAudience: string;
  messages: {
    messageBody: string;
    sequenceNumber: number;
    delayDays: number;
    callToAction: string;
    tone: string;
  }[];
  timing: {
    bestDayOfWeek: string;
    bestTimeOfDay: string;
    sendWindow: { start: string; end: string; timezone: string };
  };
  offerDetails?: {
    discount: string;
    code: string;
    expiresInDays: number;
  };
  aiReasoning: string; // Why this campaign was suggested
  coordinationNotes?: string; // How this coordinates with email campaigns
}

export class AISMSCampaignGenerator {
  /**
   * Get recent email campaign activity to avoid duplication and coordinate messaging
   */
  private async getRecentEmailActivity(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentCampaigns = await db
      .select()
      .from(emailCampaigns)
      .where(gte(emailCampaigns.createdAt, cutoffDate))
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(10);

    // Get email content for context
    const campaignDetails = await Promise.all(
      recentCampaigns.map(async (campaign) => {
        const [firstEmail] = await db
          .select()
          .from(campaignEmails)
          .where(eq(campaignEmails.campaignId, campaign.id))
          .limit(1);

        return {
          campaign,
          subject: firstEmail?.subject,
          sentDate: campaign.startedAt,
          targetAudience: campaign.targetAudience
        };
      })
    );

    return campaignDetails.filter(c => c.subject); // Only include campaigns with content
  }

  /**
   * Analyze customer engagement across channels to determine SMS vs Email preference
   */
  private async analyzeChannelPreference(segmentId?: string) {
    // Get aggregate email performance
    const emailStats = await db
      .select({
        sent: sql<number>`count(*)`,
        opened: sql<number>`count(*) filter (where ${emailSendLog.opened} = true)`,
        clicked: sql<number>`count(*) filter (where ${emailSendLog.clicked} = true)`
      })
      .from(emailSendLog)
      .where(gte(emailSendLog.sentAt, sql`now() - interval '90 days'`));

    // Get aggregate SMS performance
    const smsStats = await db
      .select({
        sent: sql<number>`count(*)`,
        delivered: sql<number>`count(*) filter (where ${smsSendLog.twilioStatus} = 'delivered')`,
        clicked: sql<number>`count(*) filter (where ${smsSendLog.linkClicked} = true)`
      })
      .from(smsSendLog)
      .where(gte(smsSendLog.sentAt, sql`now() - interval '90 days'`));

    const emailOpenRate = emailStats[0]?.sent > 0 
      ? (emailStats[0].opened / emailStats[0].sent) * 100 
      : 0;
    
    const emailClickRate = emailStats[0]?.sent > 0
      ? (emailStats[0].clicked / emailStats[0].sent) * 100
      : 0;

    const smsDeliveryRate = smsStats[0]?.sent > 0
      ? (smsStats[0].delivered / smsStats[0].sent) * 100
      : 95; // Default to industry standard

    const smsClickRate = smsStats[0]?.sent > 0
      ? (smsStats[0].clicked / smsStats[0].sent) * 100
      : 0;

    return {
      email: {
        sent: emailStats[0]?.sent || 0,
        openRate: emailOpenRate,
        clickRate: emailClickRate
      },
      sms: {
        sent: smsStats[0]?.sent || 0,
        deliveryRate: smsDeliveryRate,
        clickRate: smsClickRate
      },
      recommendation: smsClickRate > emailClickRate ? 'sms_preferred' : 'balanced'
    };
  }

  /**
   * Generate AI-powered SMS campaign suggestions
   */
  async generateCampaignSuggestions(
    context: CampaignContext,
    count: number = 3
  ): Promise<SMSCampaignSuggestion[]> {
    try {
      // Get recent email campaigns for coordination
      const recentEmails = await this.getRecentEmailActivity();
      
      // Get channel performance data
      const channelPerf = await this.analyzeChannelPreference(context.targetSegment?.id);

      // Build AI prompt with cross-channel awareness
      const emailCampaignContext = recentEmails.length > 0
        ? `\n\nRECENT EMAIL CAMPAIGNS (last 30 days):\n${recentEmails.map(e => 
            `- "${e.subject}" sent to ${e.targetAudience} on ${e.sentDate?.toLocaleDateString()}`
          ).join('\n')}`
        : '\n\nNo recent email campaigns.';

      const channelPerfContext = `\n\nCHANNEL PERFORMANCE (last 90 days):
Email: ${channelPerf.email.sent} sent, ${channelPerf.email.openRate.toFixed(1)}% open rate, ${channelPerf.email.clickRate.toFixed(1)}% click rate
SMS: ${channelPerf.sms.sent} sent, ${channelPerf.sms.deliveryRate.toFixed(1)}% delivery rate, ${channelPerf.sms.clickRate.toFixed(1)}% click rate
Recommendation: ${channelPerf.recommendation === 'sms_preferred' ? 'SMS shows stronger engagement' : 'Balanced multi-channel approach'}`;

      const prompt = `You are an expert marketing strategist for Economy Plumbing Services, a plumbing company in Austin, Texas.

Generate ${count} SMS marketing campaign suggestions with these requirements:

BUSINESS CONTEXT:
- Business: Professional plumbing services (residential & commercial)
- Location: Austin, TX area
- Brand: Economy Plumbing - "Plumbers That Care"
- Season: ${context.seasonalContext || 'Current'}
- Campaign Goal: ${context.campaignGoal}
${context.targetSegment ? `- Target Segment: ${context.targetSegment.name} (${context.targetSegment.description})` : ''}
${context.offerType ? `- Offer Type: ${context.offerType}` : ''}
${emailCampaignContext}
${channelPerfContext}

SMS CONSTRAINTS:
- Keep messages under 160 characters (1 SMS segment) when possible
- Include clear call-to-action with shortened URL placeholder: {link}
- Always include opt-out text: "Reply STOP to unsubscribe"
- Tone: Friendly, professional, helpful (not salesy)
- Must provide real value (offer, tip, exclusive access)

CROSS-CHANNEL INTELLIGENCE:
- Coordinate with recent email campaigns (don't duplicate topics)
- If email sent recently, SMS should complement (not repeat)
- If SMS performs better, prioritize direct-response offers via SMS
- Consider timing: Don't send SMS within 3 days of related email

CAMPAIGN TYPES TO CONSIDER:
- Seasonal maintenance reminders (water heater flush, AC prep, winterization)
- Flash sales (24-48 hour exclusive offers)
- VIP member exclusives (early access, special pricing)
- Referral incentives ("Refer a friend, both get $25")
- Emergency service reminders (available 24/7)
- Local event tie-ins (Austin area)

For each campaign, provide:
1. Campaign name and description
2. Target audience (be specific)
3. 1-3 SMS messages (for drip sequences)
4. Best timing (day of week, time of day, send window)
5. Optional offer details (discount %, code, expiry)
6. AI reasoning for why this campaign would work
7. How it coordinates with email campaigns

Return as JSON array of campaign suggestions.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing AI specializing in SMS campaigns for service businesses. You understand TCPA compliance, SMS best practices, and cross-channel marketing coordination. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8, // Creative but not too random
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);
      const suggestions = parsed.campaigns || parsed.suggestions || [];

      console.log(`[AI SMS Campaign] Generated ${suggestions.length} campaign suggestions`);
      
      return suggestions.map((s: any) => ({
        campaignName: s.campaignName || s.name,
        description: s.description,
        targetAudience: s.targetAudience,
        messages: (s.messages || []).map((m: any, idx: number) => ({
          messageBody: m.messageBody || m.body || m.text,
          sequenceNumber: m.sequenceNumber || idx + 1,
          delayDays: m.delayDays || 0,
          callToAction: m.callToAction || m.cta || 'Learn More',
          tone: m.tone || 'friendly'
        })),
        timing: {
          bestDayOfWeek: s.timing?.bestDayOfWeek || 'Tuesday',
          bestTimeOfDay: s.timing?.bestTimeOfDay || '10:00 AM',
          sendWindow: s.timing?.sendWindow || { start: '09:00', end: '20:00', timezone: 'America/Chicago' }
        },
        offerDetails: s.offerDetails ? {
          discount: s.offerDetails.discount,
          code: s.offerDetails.code,
          expiresInDays: s.offerDetails.expiresInDays || 7
        } : undefined,
        aiReasoning: s.aiReasoning || s.reasoning || 'AI-generated campaign',
        coordinationNotes: s.coordinationNotes || s.emailCoordination
      }));

    } catch (error) {
      console.error('[AI SMS Campaign] Error generating suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate optimized SMS copy for a specific campaign goal
   */
  async generateSMSCopy(params: {
    campaignType: string;
    targetAudience: string;
    offerDetails?: string;
    tone: 'friendly' | 'urgent' | 'professional' | 'casual';
    maxLength?: number;
  }): Promise<string> {
    const { campaignType, targetAudience, offerDetails, tone, maxLength = 160 } = params;

    const prompt = `Generate a single SMS marketing message for Economy Plumbing Services.

Campaign Type: ${campaignType}
Target Audience: ${targetAudience}
${offerDetails ? `Offer: ${offerDetails}` : ''}
Tone: ${tone}
Character Limit: ${maxLength} characters (must include "Reply STOP to unsubscribe")

Requirements:
- Clear, compelling value proposition
- Include call-to-action with {link} placeholder
- Include "Reply STOP to unsubscribe"
- Stay under ${maxLength} characters
- Brand: Economy Plumbing - professional, caring, local Austin plumber

Return ONLY the SMS text, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert SMS copywriter. Write concise, compelling messages that drive action. Always include opt-out language."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const smsText = completion.choices[0].message.content?.trim() || '';
    
    console.log(`[AI SMS] Generated copy (${smsText.length} chars): ${smsText.substring(0, 50)}...`);
    
    return smsText;
  }

  /**
   * Analyze best time to send SMS campaign based on historical data
   */
  async analyzeBestSendTime(segmentId?: string): Promise<{
    dayOfWeek: string;
    hourOfDay: number;
    reasoning: string;
  }> {
    // Query historical SMS send data to find patterns
    const historicalData = await db
      .select({
        hour: sql<number>`extract(hour from ${smsSendLog.sentAt})`,
        dow: sql<number>`extract(dow from ${smsSendLog.sentAt})`, // 0=Sunday, 6=Saturday
        clicked: smsSendLog.linkClicked,
        converted: smsSendLog.converted
      })
      .from(smsSendLog)
      .where(
        and(
          gte(smsSendLog.sentAt, sql`now() - interval '90 days'`),
          eq(smsSendLog.messageType, 'marketing')
        )
      );

    // Default to industry best practices if no data
    if (historicalData.length < 20) {
      return {
        dayOfWeek: 'Tuesday',
        hourOfDay: 10, // 10 AM
        reasoning: 'Industry best practice: Tuesday-Thursday, 10 AM - 2 PM shows highest engagement for service businesses'
      };
    }

    // Calculate click rates by hour and day
    const hourStats = new Map<number, { sent: number; clicked: number }>();
    const dowStats = new Map<number, { sent: number; clicked: number }>();

    historicalData.forEach(row => {
      const hour = row.hour;
      const dow = row.dow;

      // Hour stats
      if (!hourStats.has(hour)) hourStats.set(hour, { sent: 0, clicked: 0 });
      const hStats = hourStats.get(hour)!;
      hStats.sent++;
      if (row.clicked) hStats.clicked++;

      // Day of week stats
      if (!dowStats.has(dow)) dowStats.set(dow, { sent: 0, clicked: 0 });
      const dStats = dowStats.get(dow)!;
      dStats.sent++;
      if (row.clicked) dStats.clicked++;
    });

    // Find best hour (highest click rate, min 10 sends)
    let bestHour = 10;
    let bestHourRate = 0;
    hourStats.forEach((stats, hour) => {
      if (stats.sent >= 10) {
        const rate = stats.clicked / stats.sent;
        if (rate > bestHourRate) {
          bestHourRate = rate;
          bestHour = hour;
        }
      }
    });

    // Find best day (highest click rate, min 10 sends)
    let bestDow = 2; // Tuesday
    let bestDowRate = 0;
    dowStats.forEach((stats, dow) => {
      if (stats.sent >= 10) {
        const rate = stats.clicked / stats.sent;
        if (rate > bestDowRate) {
          bestDowRate = rate;
          bestDow = dow;
        }
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      dayOfWeek: dayNames[bestDow],
      hourOfDay: bestHour,
      reasoning: `Based on ${historicalData.length} historical SMS sends: ${dayNames[bestDow]} at ${bestHour}:00 shows ${(bestHourRate * 100).toFixed(1)}% click rate`
    };
  }

  /**
   * Create multi-channel campaign strategy (coordinated email + SMS)
   */
  async createMultiChannelStrategy(params: {
    campaignGoal: string;
    targetSegment?: CustomerSegment;
    offerType?: string;
  }): Promise<{
    emailFirst: boolean;
    smsDelay: number; // Days after email
    emailSubject: string;
    smsBody: string;
    reasoning: string;
  }> {
    const channelPerf = await this.analyzeChannelPreference(params.targetSegment?.id);

    const prompt = `Create a multi-channel marketing strategy for Economy Plumbing Services.

Campaign Goal: ${params.campaignGoal}
Target: ${params.targetSegment?.name || 'All customers'}
${params.offerType ? `Offer: ${params.offerType}` : ''}

Channel Performance:
- Email: ${channelPerf.email.openRate.toFixed(1)}% open, ${channelPerf.email.clickRate.toFixed(1)}% click
- SMS: ${channelPerf.sms.deliveryRate.toFixed(1)}% delivery, ${channelPerf.sms.clickRate.toFixed(1)}% click

Decide:
1. Should we send email first or SMS first?
2. How many days delay between channels?
3. What should the email subject be?
4. What should the SMS message be? (max 160 chars, include "Reply STOP to unsubscribe")

Return as JSON with: emailFirst (boolean), smsDelay (number), emailSubject (string), smsBody (string), reasoning (string)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a multi-channel marketing expert. You understand how to coordinate email and SMS for maximum impact."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const strategy = JSON.parse(response);
    
    console.log(`[Multi-Channel] Strategy: ${strategy.emailFirst ? 'Email→SMS' : 'SMS→Email'} with ${strategy.smsDelay}d delay`);
    
    return {
      emailFirst: strategy.emailFirst,
      smsDelay: strategy.smsDelay || 2,
      emailSubject: strategy.emailSubject,
      smsBody: strategy.smsBody,
      reasoning: strategy.reasoning
    };
  }

  /**
   * Get seasonal SMS campaign recommendations
   */
  async getSeasonalCampaigns(): Promise<SMSCampaignSuggestion[]> {
    const month = new Date().getMonth(); // 0-11
    let season: string;
    
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    return this.generateCampaignSuggestions({
      businessType: 'plumbing',
      seasonalContext: season,
      campaignGoal: 'awareness',
      offerType: 'seasonal'
    }, 3);
  }
}

// Singleton instance
export const aiSMSCampaignGenerator = new AISMSCampaignGenerator();
