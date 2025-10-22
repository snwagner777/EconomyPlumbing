import { db } from "../db";
import { 
  serviceTitanEstimates, 
  serviceTitanCustomers,
  customerSegments,
  segmentMembership,
  emailCampaigns,
  emailCampaignEmails,
  smsCampaigns,
  smsCampaignMessages
} from "@shared/schema";
import { and, eq, gt, lt, sql, desc, isNull, not, inArray } from "drizzle-orm";
import OpenAI from "openai";
import { enterCustomerIntoSegment } from "./audienceManager";
import type { IStorage } from "../storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UnsoldEstimate {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  estimateTotal: number;
  estimateName: string;
  createdOn: Date;
  daysOld: number;
  jobType: string | null;
  technicianName: string | null;
  lastFollowUpDate: Date | null;
  followUpCount: number;
}

interface RemarketingCampaign {
  segmentId: string;
  emailCampaignId?: string;
  smsCampaignId?: string;
  estimateIds: number[];
  totalValue: number;
  strategy: RemarketingStrategy;
}

interface RemarketingStrategy {
  approach: 'discount' | 'urgency' | 'value' | 'trust' | 'seasonal';
  messaging: string;
  offerType?: string;
  discountPercent?: number;
  urgencyDays?: number;
  followUpSequence: FollowUpMessage[];
}

interface FollowUpMessage {
  day: number;
  channel: 'email' | 'sms' | 'both';
  subject?: string;
  content: string;
  tone: 'friendly' | 'professional' | 'urgent';
}

/**
 * Scan for unsold estimates and create remarketing campaigns
 */
export async function scanUnsoldEstimates(storage: IStorage): Promise<RemarketingCampaign[]> {
  console.log('[Remarketing] Starting unsold estimate scan...');
  
  // Get unsold estimates from the last 90 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const unsoldEstimates = await findUnsoldEstimates(cutoffDate);
  
  console.log(`[Remarketing] Found ${unsoldEstimates.length} unsold estimates`);
  
  if (unsoldEstimates.length === 0) {
    return [];
  }
  
  // Group estimates by strategy
  const groups = groupEstimatesByStrategy(unsoldEstimates);
  
  // Create campaigns for each group
  const campaigns: RemarketingCampaign[] = [];
  
  for (const [strategy, estimates] of Object.entries(groups)) {
    const campaign = await createRemarketingCampaign(
      estimates,
      strategy as RemarketingStrategy['approach'],
      storage
    );
    campaigns.push(campaign);
  }
  
  console.log(`[Remarketing] Created ${campaigns.length} remarketing campaigns`);
  
  return campaigns;
}

/**
 * Find unsold estimates that haven't been converted to jobs
 */
async function findUnsoldEstimates(afterDate: Date): Promise<UnsoldEstimate[]> {
  const results = await db
    .select({
      id: serviceTitanEstimates.id,
      customerId: serviceTitanEstimates.customerId,
      customerName: serviceTitanCustomers.name,
      customerEmail: serviceTitanCustomers.email,
      customerPhone: serviceTitanCustomers.primaryPhone,
      estimateTotal: serviceTitanEstimates.total,
      estimateName: serviceTitanEstimates.name,
      createdOn: serviceTitanEstimates.createdOn,
      jobType: serviceTitanEstimates.jobType,
      technicianName: serviceTitanEstimates.salesRepresentativeName,
    })
    .from(serviceTitanEstimates)
    .leftJoin(
      serviceTitanCustomers,
      eq(serviceTitanEstimates.customerId, serviceTitanCustomers.id)
    )
    .where(
      and(
        eq(serviceTitanEstimates.status, 'Open'),
        isNull(serviceTitanEstimates.soldJobId),
        gt(serviceTitanEstimates.createdOn, afterDate),
        gt(serviceTitanEstimates.total, 10000) // Focus on estimates over $100
      )
    )
    .orderBy(desc(serviceTitanEstimates.total));
  
  // Calculate days old and filter out recently created
  const now = new Date();
  return results
    .map(r => ({
      ...r,
      daysOld: Math.floor((now.getTime() - r.createdOn.getTime()) / (1000 * 60 * 60 * 24)),
      lastFollowUpDate: null, // Would need to track this separately
      followUpCount: 0
    }))
    .filter(e => e.daysOld >= 3); // Wait at least 3 days before remarketing
}

/**
 * Group estimates by recommended remarketing strategy
 */
function groupEstimatesByStrategy(estimates: UnsoldEstimate[]): Record<string, UnsoldEstimate[]> {
  const groups: Record<string, UnsoldEstimate[]> = {
    urgent: [],
    discount: [],
    value: [],
    trust: [],
    seasonal: []
  };
  
  const currentMonth = new Date().getMonth();
  const isWinter = currentMonth >= 10 || currentMonth <= 1;
  const isSummer = currentMonth >= 5 && currentMonth <= 7;
  
  for (const estimate of estimates) {
    // Urgent: 3-7 days old, high value
    if (estimate.daysOld <= 7 && estimate.estimateTotal > 50000) {
      groups.urgent.push(estimate);
    }
    // Discount: 7-30 days old
    else if (estimate.daysOld > 7 && estimate.daysOld <= 30) {
      groups.discount.push(estimate);
    }
    // Seasonal: Weather-related services
    else if (
      (isWinter && estimate.jobType?.toLowerCase().includes('water heater')) ||
      (isSummer && estimate.jobType?.toLowerCase().includes('cooling'))
    ) {
      groups.seasonal.push(estimate);
    }
    // Trust: 30-60 days old
    else if (estimate.daysOld > 30 && estimate.daysOld <= 60) {
      groups.trust.push(estimate);
    }
    // Value: Everything else
    else {
      groups.value.push(estimate);
    }
  }
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, estimates]) => estimates.length > 0)
  );
}

/**
 * Create a remarketing campaign for a group of estimates
 */
async function createRemarketingCampaign(
  estimates: UnsoldEstimate[],
  approach: RemarketingStrategy['approach'],
  storage: IStorage
): Promise<RemarketingCampaign> {
  console.log(`[Remarketing] Creating ${approach} campaign for ${estimates.length} estimates`);
  
  // Create or find segment
  const segmentName = `Unsold Estimates - ${approach.charAt(0).toUpperCase() + approach.slice(1)} Strategy`;
  const segment = await createOrUpdateSegment(segmentName, estimates, approach, storage);
  
  // Add customers to segment
  for (const estimate of estimates) {
    if (estimate.customerEmail || estimate.customerPhone) {
      await enterCustomerIntoSegment({
        segmentId: segment.id,
        customerId: estimate.customerId,
        customerName: estimate.customerName,
        customerEmail: estimate.customerEmail,
        reason: `Unsold estimate: ${estimate.estimateName}`,
        triggeringEvent: 'unsold_estimate_detected',
        eventData: {
          estimateId: estimate.id,
          estimateTotal: estimate.estimateTotal,
          daysOld: estimate.daysOld
        }
      });
    }
  }
  
  // Generate remarketing strategy
  const strategy = await generateRemarketingStrategy(estimates, approach);
  
  // Create email campaign if customers have emails
  const emailRecipients = estimates.filter(e => e.customerEmail);
  let emailCampaignId: string | undefined;
  
  if (emailRecipients.length > 0) {
    emailCampaignId = await createEmailRemarketingCampaign(
      segment.id,
      strategy,
      emailRecipients,
      storage
    );
  }
  
  // Create SMS campaign if customers have phones
  const smsRecipients = estimates.filter(e => e.customerPhone);
  let smsCampaignId: string | undefined;
  
  if (smsRecipients.length > 0) {
    smsCampaignId = await createSMSRemarketingCampaign(
      segment.id,
      strategy,
      smsRecipients,
      storage
    );
  }
  
  return {
    segmentId: segment.id,
    emailCampaignId,
    smsCampaignId,
    estimateIds: estimates.map(e => e.id),
    totalValue: estimates.reduce((sum, e) => sum + e.estimateTotal, 0),
    strategy
  };
}

/**
 * Create or update a customer segment for remarketing
 */
async function createOrUpdateSegment(
  name: string,
  estimates: UnsoldEstimate[],
  approach: string,
  storage: IStorage
): Promise<any> {
  // Check if segment exists
  const existing = await db
    .select()
    .from(customerSegments)
    .where(eq(customerSegments.name, name))
    .limit(1);
  
  if (existing.length > 0) {
    // Update member count
    await db
      .update(customerSegments)
      .set({
        memberCount: estimates.length,
        updatedAt: new Date()
      })
      .where(eq(customerSegments.id, existing[0].id));
    
    return existing[0];
  }
  
  // Create new segment
  const segment = await storage.createCustomerSegment({
    name,
    description: `Customers with unsold estimates using ${approach} remarketing strategy`,
    segmentType: 'evergreen',
    targetCriteria: {
      hasUnsoldEstimate: true,
      remarketingStrategy: approach,
      minEstimateAge: 3,
      maxEstimateAge: 90
    },
    generatedByAI: true,
    aiReasoning: `Identified ${estimates.length} customers with unsold estimates totaling $${(estimates.reduce((sum, e) => sum + e.estimateTotal, 0) / 100).toLocaleString()}. Using ${approach} strategy for conversion.`,
    status: 'pending_approval',
    memberCount: estimates.length,
    totalRevenue: 0,
    totalJobsBooked: 0
  });
  
  return segment;
}

/**
 * Generate AI-powered remarketing strategy
 */
async function generateRemarketingStrategy(
  estimates: UnsoldEstimate[],
  approach: RemarketingStrategy['approach']
): Promise<RemarketingStrategy> {
  const avgEstimateValue = estimates.reduce((sum, e) => sum + e.estimateTotal, 0) / estimates.length / 100;
  const avgDaysOld = estimates.reduce((sum, e) => sum + e.daysOld, 0) / estimates.length;
  const jobTypes = [...new Set(estimates.map(e => e.jobType).filter(Boolean))];
  
  const prompt = `You are a plumbing services remarketing specialist. Create a remarketing strategy for unsold estimates.

Context:
- Number of estimates: ${estimates.length}
- Average estimate value: $${avgEstimateValue.toFixed(2)}
- Average age: ${avgDaysOld.toFixed(0)} days
- Service types: ${jobTypes.join(', ')}
- Strategy approach: ${approach}

Requirements:
1. Create a multi-touch follow-up sequence (3-5 messages)
2. Use ${approach} messaging approach
3. Include specific offers if appropriate
4. Vary tone and urgency across the sequence
5. Mix email and SMS channels

Return a JSON object with:
{
  "approach": "${approach}",
  "messaging": "core value proposition",
  "offerType": "type of offer if any",
  "discountPercent": number if discount offered,
  "urgencyDays": days until offer expires if applicable,
  "followUpSequence": [
    {
      "day": day number (0, 3, 7, 14, etc),
      "channel": "email" | "sms" | "both",
      "subject": "email subject if email",
      "content": "message content",
      "tone": "friendly" | "professional" | "urgent"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a remarketing specialist for a plumbing company. Create compelling follow-up sequences that convert unsold estimates into booked jobs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const strategy = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure we have a valid strategy
    if (!strategy.followUpSequence || strategy.followUpSequence.length === 0) {
      return getDefaultStrategy(approach);
    }
    
    return strategy;
  } catch (error) {
    console.error('[Remarketing] Strategy generation error:', error);
    return getDefaultStrategy(approach);
  }
}

/**
 * Get default remarketing strategy as fallback
 */
function getDefaultStrategy(approach: RemarketingStrategy['approach']): RemarketingStrategy {
  const strategies: Record<string, RemarketingStrategy> = {
    discount: {
      approach: 'discount',
      messaging: 'Limited-time savings on your plumbing project',
      offerType: 'percentage_discount',
      discountPercent: 10,
      urgencyDays: 7,
      followUpSequence: [
        {
          day: 0,
          channel: 'email',
          subject: 'Your estimate is ready - Save 10% this week',
          content: 'We noticed you reviewed our estimate. Book this week and save 10%!',
          tone: 'friendly'
        },
        {
          day: 3,
          channel: 'sms',
          content: 'Hi! Your 10% discount expires in 4 days. Ready to schedule? Reply YES or call 469-PLUMBER',
          tone: 'friendly'
        },
        {
          day: 6,
          channel: 'email',
          subject: 'Last day to save 10% on your plumbing service',
          content: 'Your discount expires tomorrow. Don\'t miss out on these savings!',
          tone: 'urgent'
        }
      ]
    },
    urgency: {
      approach: 'urgency',
      messaging: 'Prevent costly damage with prompt service',
      urgencyDays: 3,
      followUpSequence: [
        {
          day: 0,
          channel: 'both',
          subject: 'Important: About your plumbing estimate',
          content: 'Delaying repairs could lead to more expensive problems. Let\'s get this fixed!',
          tone: 'professional'
        },
        {
          day: 2,
          channel: 'sms',
          content: 'Quick reminder about your plumbing issue. Small problems become big ones. Call 469-PLUMBER today!',
          tone: 'urgent'
        }
      ]
    },
    value: {
      approach: 'value',
      messaging: 'Quality service that protects your home investment',
      followUpSequence: [
        {
          day: 0,
          channel: 'email',
          subject: 'Why Economy Plumbing is your best choice',
          content: 'Our experienced technicians, warranty, and fair pricing make us the smart choice.',
          tone: 'professional'
        },
        {
          day: 7,
          channel: 'email',
          subject: 'Questions about your estimate?',
          content: 'We\'re here to explain every detail and ensure you\'re comfortable moving forward.',
          tone: 'friendly'
        }
      ]
    },
    trust: {
      approach: 'trust',
      messaging: 'Join thousands of satisfied customers',
      followUpSequence: [
        {
          day: 0,
          channel: 'email',
          subject: 'See what your neighbors are saying',
          content: 'Check out our 5-star reviews and see why Dallas trusts Economy Plumbing.',
          tone: 'friendly'
        },
        {
          day: 14,
          channel: 'email',
          subject: 'We\'re still here when you\'re ready',
          content: 'No pressure - your estimate is valid for 90 days. We\'re here when you need us.',
          tone: 'friendly'
        }
      ]
    },
    seasonal: {
      approach: 'seasonal',
      messaging: 'Seasonal service to protect your home',
      urgencyDays: 14,
      followUpSequence: [
        {
          day: 0,
          channel: 'both',
          subject: 'Prepare your plumbing for the season',
          content: 'Don\'t let weather cause plumbing problems. Schedule your service today!',
          tone: 'professional'
        },
        {
          day: 7,
          channel: 'sms',
          content: 'Weather changes affect plumbing. Protect your home - call 469-PLUMBER',
          tone: 'friendly'
        }
      ]
    }
  };
  
  return strategies[approach] || strategies.value;
}

/**
 * Create email remarketing campaign
 */
async function createEmailRemarketingCampaign(
  segmentId: string,
  strategy: RemarketingStrategy,
  recipients: UnsoldEstimate[],
  storage: IStorage
): Promise<string> {
  // Create campaign
  const campaign = await storage.createEmailCampaign({
    name: `Unsold Estimate Follow-up - ${strategy.approach}`,
    segmentId,
    status: 'pending_approval',
    emailType: 'promotional',
    generatedByAI: true,
    aiPrompt: `Remarketing campaign for ${recipients.length} unsold estimates`,
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalUnsubscribed: 0,
    totalBounced: 0,
    trackingPhoneNumber: null // Will be assigned on approval
  });
  
  // Create email sequence
  for (const message of strategy.followUpSequence) {
    if (message.channel === 'email' || message.channel === 'both') {
      await db.insert(emailCampaignEmails).values({
        campaignId: campaign.id,
        sequenceNumber: message.day,
        dayOffset: message.day,
        subject: message.subject || 'Follow-up on your estimate',
        preheader: strategy.messaging,
        htmlContent: generateEmailHTML(message.content, strategy),
        textContent: message.content,
        generatedByAI: true,
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0
      });
    }
  }
  
  return campaign.id;
}

/**
 * Create SMS remarketing campaign
 */
async function createSMSRemarketingCampaign(
  segmentId: string,
  strategy: RemarketingStrategy,
  recipients: UnsoldEstimate[],
  storage: IStorage
): Promise<string> {
  const campaignId = crypto.randomUUID();
  
  // Create campaign
  await db.insert(smsCampaigns).values({
    id: campaignId,
    name: `Unsold Estimate SMS - ${strategy.approach}`,
    segmentId,
    status: 'pending_approval',
    messageType: 'promotional',
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalOptOuts: 0,
    generatedByAI: true,
    aiPrompt: `SMS remarketing for ${recipients.length} unsold estimates`,
    trackingPhoneNumber: null // Will be assigned on approval
  });
  
  // Create message sequence
  for (const message of strategy.followUpSequence) {
    if (message.channel === 'sms' || message.channel === 'both') {
      await db.insert(smsCampaignMessages).values({
        campaignId,
        sequenceNumber: message.day,
        dayOffset: message.day,
        messageBody: message.content + ' Reply STOP to opt out',
        includeUnsubscribe: true,
        generatedByAI: true,
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalClicks: 0
      });
    }
  }
  
  return campaignId;
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(content: string, strategy: RemarketingStrategy): string {
  const offerBanner = strategy.discountPercent 
    ? `<div style="background-color: #10b981; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold;">
        Save ${strategy.discountPercent}% - Limited Time Offer
      </div>`
    : '';
  
  const urgencyNote = strategy.urgencyDays
    ? `<p style="color: #ef4444; font-weight: bold; text-align: center;">
        Offer expires in ${strategy.urgencyDays} days
      </p>`
    : '';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    ${offerBanner}
    
    <div style="padding: 30px;">
      <h2 style="color: #1e40af; margin-bottom: 20px;">Following Up on Your Estimate</h2>
      
      <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
        ${content}
      </p>
      
      ${urgencyNote}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://economyplumbingservices.com/schedule" 
           style="display: inline-block; padding: 15px 30px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Schedule Service
        </a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px;">
          Have questions? Call us at <strong>469-PLUMBER</strong><br>
          We're here to help!
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Track remarketing performance
 */
export async function trackRemarketingConversion(
  estimateId: number,
  jobId: number,
  campaignType: 'email' | 'sms'
): Promise<void> {
  console.log(`[Remarketing] Conversion tracked: Estimate ${estimateId} -> Job ${jobId} via ${campaignType}`);
  
  // Update estimate with sold job ID
  await db
    .update(serviceTitanEstimates)
    .set({
      soldJobId: jobId,
      status: 'Sold',
      modifiedOn: new Date()
    })
    .where(eq(serviceTitanEstimates.id, estimateId));
  
  // Update segment performance metrics
  // This would update the segment's totalRevenue and totalJobsBooked
}