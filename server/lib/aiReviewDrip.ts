import OpenAI from "openai";
import type { ReviewRequestCampaign, ReviewDripEmail } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DripTiming {
  sequenceNumber: number;
  dayOffset: number;
  messagingTactic: string;
  behaviorCondition: string | null;
}

export interface DripCampaignStrategy {
  campaignName: string;
  description: string;
  dripSchedule: DripTiming[];
  aiReasoning: string;
  expectedConversionRate: number; // Percentage (e.g., 2500 = 25.00%)
}

export interface EmailVariation {
  sequenceNumber: number;
  dayOffset: number;
  behaviorCondition: string | null;
  subject: string;
  preheader: string;
  messagingTactic: string;
  bodyStructure: {
    opening: string;
    mainMessage: string;
    callToAction: string;
    closing: string;
  };
  aiReasoning: string;
}

export interface ReviewEmailContent {
  emails: EmailVariation[];
  aiPrompt: string;
}

/**
 * Generate AI-optimized review request drip campaign strategy
 * Uses GPT-4o to determine optimal timing for 5-7 follow-ups based on:
 * - Industry best practices for review requests
 * - Customer engagement patterns
 * - Behavioral psychology principles
 */
export async function generateDripCampaignStrategy(): Promise<DripCampaignStrategy> {
  console.log('[AI Review Drip] Generating optimal drip campaign strategy...');

  const aiPrompt = buildDripStrategyPrompt();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert in customer review acquisition for service businesses. Your specialty is designing high-converting email drip campaigns that maximize review completion rates while maintaining customer goodwill.

CRITICAL RULES:
1. Generate 5-7 follow-up emails with optimal timing
2. Include behavioral branching for "clicked but didn't review"
3. Balance persistence with respect (don't annoy customers)
4. Use proven timing patterns from service industry data
5. Consider customer psychology and decision-making patterns

TIMING PRINCIPLES:
- First email: Day 0 (same day as job completion)
- Early follow-ups: Day 2-3 (high urgency, fresh memory)
- Mid follow-ups: Day 7-10 (gentle reminder)
- Late follow-ups: Day 14-28 (final asks, longer intervals)
- Behavioral branch: Day 3+ after click (special messaging)

OUTPUT FORMAT (JSON):
{
  "campaignName": "Standard Review Request Drip",
  "description": "AI-optimized 7-email sequence with behavioral branching",
  "dripSchedule": [
    {
      "sequenceNumber": 1,
      "dayOffset": 0,
      "messagingTactic": "initial_request",
      "behaviorCondition": null
    }
  ],
  "aiReasoning": "Why this timing strategy will maximize conversions",
  "expectedConversionRate": 2500
}`,
      },
      {
        role: "user",
        content: aiPrompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const rawContent = response.choices[0].message.content;
  if (!rawContent) {
    throw new Error('No response from GPT-4o');
  }

  const strategy = JSON.parse(rawContent) as DripCampaignStrategy;

  console.log('[AI Review Drip] Strategy generated:', {
    emailCount: strategy.dripSchedule.length,
    expectedConversionRate: strategy.expectedConversionRate / 100 + '%',
  });

  return strategy;
}

/**
 * Generate personalized email content for review request drip sequence
 * Uses GPT-4o to create compelling, behavior-aware messaging
 */
export async function generateDripEmailContent(
  dripSchedule: DripTiming[],
  jobContext?: {
    jobType?: string;
    technicianName?: string;
    customerSatisfaction?: number;
  }
): Promise<ReviewEmailContent> {
  console.log('[AI Review Drip] Generating email content for', dripSchedule.length, 'emails...');

  const aiPrompt = buildEmailContentPrompt(dripSchedule, jobContext);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert copywriter specializing in customer review requests for service businesses. You write compelling, authentic emails that motivate customers to leave reviews while feeling natural and not salesy.

CRITICAL RULES:
1. Write in a friendly, conversational tone (NOT corporate)
2. Keep emails SHORT (2-3 paragraphs maximum)
3. Use merge tags for personalization: {firstName}, {technicianName}, {jobType}
4. Adapt messaging based on behavioral conditions
5. Make it EASY to take action (clear, simple CTA)
6. Show genuine appreciation and humility

BEHAVIORAL MESSAGING TACTICS:
- initial_request: Thank customer, make it easy to review
- gentle_reminder: Short, friendly nudge (not pushy)
- clicked_followup: "We noticed you started..." - help them complete
- final_ask: Last chance, express appreciation, make it quick
- not_opened: Different subject line, fresh angle

EMAIL STRUCTURE:
- Subject: Catchy, personal, NOT spammy
- Preheader: Expand on subject, create curiosity
- Body: 2-3 short paragraphs, ONE clear CTA
- Tone: Friendly neighbor, NOT sales robot

OUTPUT FORMAT (JSON):
{
  "emails": [
    {
      "sequenceNumber": 1,
      "dayOffset": 0,
      "behaviorCondition": null,
      "subject": "Thanks {firstName}! Quick favor?",
      "preheader": "Your feedback helps us serve you better",
      "messagingTactic": "initial_request",
      "bodyStructure": {
        "opening": "Hi {firstName}, thanks for trusting us with your {jobType} service!",
        "mainMessage": "We'd love to know how {technicianName} did. Mind sharing a quick review?",
        "callToAction": "Leave a review (takes 60 seconds)",
        "closing": "Thanks for being awesome!"
      },
      "aiReasoning": "Why this approach works for this sequence"
    }
  ],
  "aiPrompt": "Original prompt"
}`,
      },
      {
        role: "user",
        content: aiPrompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8, // Higher creativity for compelling copy
  });

  const rawContent = response.choices[0].message.content;
  if (!rawContent) {
    throw new Error('No response from GPT-4o');
  }

  const content = JSON.parse(rawContent) as ReviewEmailContent;

  console.log('[AI Review Drip] Email content generated for', content.emails.length, 'variations');

  return content;
}

/**
 * Generate behavioral branch messaging for "clicked but didn't review"
 * Special messaging for customers who showed interest but didn't complete
 */
export async function generateClickedFollowupEmail(jobContext?: {
  platformClicked?: string;
  clickCount?: number;
}): Promise<EmailVariation> {
  console.log('[AI Review Drip] Generating clicked followup email...');

  const platformName = jobContext?.platformClicked === 'google' ? 'Google' :
                       jobContext?.platformClicked === 'facebook' ? 'Facebook' :
                       jobContext?.platformClicked === 'yelp' ? 'Yelp' : 'our review page';

  const aiPrompt = `Create a compelling follow-up email for a customer who clicked the review link to ${platformName} ${jobContext?.clickCount || 1} time(s) but didn't leave a review.

CONTEXT:
- Customer showed interest (clicked the link)
- Something stopped them from completing
- This is a re-engagement opportunity

MESSAGING STRATEGY:
- Acknowledge they started ("We noticed you clicked...")
- Address potential barriers ("Too busy? Having trouble?")
- Make it SUPER EASY (direct link, one-click options)
- Add gentle urgency ("Takes just 60 seconds")
- Show appreciation for their time

Generate a warm, helpful email that removes friction and motivates completion.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at re-engaging customers who showed interest but didn't complete an action. Write empathetic, low-pressure emails that remove friction and motivate completion.`,
      },
      {
        role: "user",
        content: aiPrompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const rawContent = response.choices[0].message.content;
  if (!rawContent) {
    throw new Error('No response from GPT-4o');
  }

  const result = JSON.parse(rawContent);

  return {
    sequenceNumber: 99, // Special sequence for behavioral branch
    dayOffset: 3,
    behaviorCondition: 'clicked_not_reviewed',
    subject: result.subject,
    preheader: result.preheader,
    messagingTactic: 'clicked_followup',
    bodyStructure: result.bodyStructure,
    aiReasoning: result.aiReasoning || 'Re-engagement email for customers who clicked but didn\'t review',
  };
}

/**
 * Build AI prompt for drip strategy generation
 */
function buildDripStrategyPrompt(): string {
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  return `Design the optimal email drip campaign timing for a plumbing services company requesting customer reviews after job completion.

CURRENT CONTEXT:
- Month: ${currentMonth}
- Industry: Plumbing/Home Services
- Goal: Maximize review completion rate
- Constraint: Don't annoy customers (maintain goodwill)

REQUIREMENTS:
1. Generate 5-7 follow-up emails with optimal day offsets
2. Include at least one behavioral branch for "clicked but didn't review"
3. Use proven timing patterns from service industry
4. Balance persistence with respect for customer time
5. Consider customer psychology (urgency, reciprocity, social proof)

BEST PRACTICES TO FOLLOW:
- Strike while iron is hot (early follow-ups within 3 days)
- Space out reminders (don't spam)
- Final asks should be gentle, not desperate
- Behavioral branches should feel helpful, not creepy

Provide your recommended drip schedule with clear reasoning for each timing decision.`;
}

/**
 * Build AI prompt for email content generation
 */
function buildEmailContentPrompt(
  dripSchedule: DripTiming[],
  jobContext?: {
    jobType?: string;
    technicianName?: string;
    customerSatisfaction?: number;
  }
): string {
  return `Write compelling email content for a ${dripSchedule.length}-email review request drip sequence for a plumbing services company.

DRIP SCHEDULE:
${dripSchedule.map(d => `- Email ${d.sequenceNumber}: Day ${d.dayOffset} (${d.messagingTactic}${d.behaviorCondition ? `, condition: ${d.behaviorCondition}` : ''})`).join('\n')}

JOB CONTEXT:
${jobContext?.jobType ? `- Job Type: ${jobContext.jobType}` : ''}
${jobContext?.technicianName ? `- Technician: ${jobContext.technicianName}` : ''}
${jobContext?.customerSatisfaction ? `- Satisfaction: ${jobContext.customerSatisfaction}/5 stars` : ''}

MERGE TAGS AVAILABLE:
- {firstName} - Customer first name
- {customerName} - Full customer name
- {technicianName} - Technician who did the work
- {jobType} - Type of service performed
- {completedDate} - When job was completed
- {reviewUrl} - Personalized review link

REQUIREMENTS:
1. Write subject lines that get opened (NO "Review Request" in subject)
2. Keep emails SHORT (customers are busy)
3. Adapt tone based on sequence (grateful → friendly → gentle nudge)
4. Make CTA crystal clear and easy
5. Use behavioral branching for clicked-but-not-reviewed

Generate email content for all ${dripSchedule.length} emails in the sequence.`;
}
