/**
 * AI Email Generator
 * 
 * Generates personalized review request and referral nurture emails using OpenAI GPT-4o.
 * Features:
 * - Job-specific personalization (service type, amount, date)
 * - Seasonal awareness (winter freeze warnings, summer heat, etc.)
 * - Campaign stage optimization (urgency increases over drip sequence)
 * - Multiple messaging strategies (value, trust, urgency, social proof)
 * - Phone number integration for tracking
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface JobDetails {
  customerId: number;
  customerName: string;
  serviceType?: string;
  jobAmount?: number;
  jobDate?: Date;
  location?: string;
}

interface GenerateEmailOptions {
  campaignType: 'review_request' | 'referral_nurture' | 'quote_followup';
  emailNumber: 1 | 2 | 3 | 4; // Which email in the drip sequence
  jobDetails: JobDetails;
  phoneNumber?: string;
  referralLink?: string; // Full referral link (e.g., "https://plumbersthatcare.com/ref/JOHN-SMITH")
  strategy?: 'value' | 'trust' | 'urgency' | 'social_proof' | 'seasonal';
}

interface GeneratedEmail {
  subject: string;
  preheader: string;
  bodyHtml: string;
  bodyPlain: string;
  strategy: string;
  seasonalContext?: string;
}

/**
 * Get current season and relevant messaging context
 */
function getSeasonalContext(): { season: string; context: string } {
  const month = new Date().getMonth(); // 0-11
  
  if (month >= 11 || month <= 1) {
    // December, January, February
    return {
      season: 'winter',
      context: 'Winter freeze protection is critical in Texas. Mention protecting pipes, water heater maintenance before cold snaps, and emergency service availability.'
    };
  } else if (month >= 2 && month <= 4) {
    // March, April, May
    return {
      season: 'spring',
      context: 'Spring is the perfect time for plumbing maintenance. Mention checking for winter damage, preparing for summer heat, and scheduling annual inspections.'
    };
  } else if (month >= 5 && month <= 7) {
    // June, July, August
    return {
      season: 'summer',
      context: 'Summer heat stresses plumbing systems. Mention water heater efficiency, increased water usage, A/C condensate line maintenance, and irrigation system checks.'
    };
  } else {
    // September, October, November
    return {
      season: 'fall',
      context: 'Fall is ideal for preparing plumbing for winter. Mention water heater inspections before winter, outdoor faucet winterization, and scheduling service before holidays.'
    };
  }
}

/**
 * Get messaging strategy for specific email number in sequence
 */
function getEmailStrategy(campaignType: 'review_request' | 'referral_nurture' | 'quote_followup', emailNumber: number, customStrategy?: string): string {
  if (customStrategy) return customStrategy;
  
  if (campaignType === 'review_request') {
    // Review Request Drip (21 days)
    const strategies = {
      1: 'value', // Day 1: Thank you + easy review process
      2: 'trust', // Day 7: We value your feedback
      3: 'social_proof', // Day 14: Others are sharing experiences
      4: 'urgency', // Day 21: Final gentle reminder
    };
    return strategies[emailNumber as keyof typeof strategies] || 'value';
  } else if (campaignType === 'referral_nurture') {
    // Referral Nurture (6 months)
    const strategies = {
      1: 'value', // Day 14: Introduce referral program + $25 reward
      2: 'trust', // Day 60: Your friends deserve quality service
      3: 'social_proof', // Day 150: Share success stories from referrals
      4: 'urgency', // Day 210: Limited time to earn rewards (soft close)
    };
    return strategies[emailNumber as keyof typeof strategies] || 'value';
  } else {
    // Quote Follow-up (21 days) - nurture potential customers
    const strategies = {
      1: 'value', // Day 1: Thank you for considering us
      2: 'trust', // Day 7: We're here when you're ready
      3: 'seasonal', // Day 14: Timely service reminders
      4: 'urgency', // Day 21: Limited-time offer or seasonal urgency
    };
    return strategies[emailNumber as keyof typeof strategies] || 'value';
  }
}

/**
 * Generate personalized email content using AI
 */
export async function generateEmail(options: GenerateEmailOptions): Promise<GeneratedEmail> {
  const { campaignType, emailNumber, jobDetails, phoneNumber, referralLink, strategy: customStrategy } = options;
  const { season, context: seasonalContext } = getSeasonalContext();
  const strategy = getEmailStrategy(campaignType, emailNumber, customStrategy);

  // Build the AI prompt
  const emailSequence = `Email ${emailNumber} of 4`;
  const daysFromJob = campaignType === 'referral_nurture'
    ? [14, 60, 150, 210][emailNumber - 1]
    : [1, 7, 14, 21][emailNumber - 1]; // review_request and quote_followup use same timing

  const systemPrompt = `You are an expert email copywriter for Economy Plumbing Services, a family-owned plumbing company serving Austin and Central Texas.

Brand Voice:
- Friendly, professional, and trustworthy
- Texas-local feel (but not overly "y'all")
- Focus on quality service and customer relationships
- Value honesty and transparency
- Family-owned business for 20+ years

CRITICAL: Template Generation Rules:
- You are creating TEMPLATES with merge fields, not personalized emails
- Use merge field syntax: {{customerName}}, {{serviceType}}, {{jobAmount}}, {{location}}
- NEVER use hardcoded names like "John" or "Sarah"
- DO NOT include seasonal content (fall, winter, summer, etc.) - that will be added dynamically at send-time
- DO NOT reference specific job details - use merge fields instead
- Templates should be evergreen and work year-round
- The admin will approve the template structure/tone, then AI will personalize for each customer at send-time
- Available merge fields: {{customerName}}, {{serviceType}}, {{jobAmount}}, {{location}}, {{jobDate}}

Email Guidelines:
- Keep subject lines under 50 characters, compelling and personal
- Preheader should complement subject (40-80 chars)
- Use HTML formatting with proper structure
- Include clear call-to-action buttons
- Mobile-friendly layout
- Use merge fields for personalization ({{customerName}}, {{serviceType}}, etc.)
- ${phoneNumber ? `Include phone number ${phoneNumber} for tracking` : 'No phone number tracking'}`;

  let userPrompt = '';
  
  if (campaignType === 'review_request') {
    userPrompt = `
Generate a review request email with these specifications:

Campaign Details:
- Type: Review Request Drip Campaign
- ${emailSequence} in sequence (sent ${daysFromJob} days after service completion)
- Strategy: ${strategy}
- NOTE: Do NOT include seasonal context in template - it will be added dynamically when sending

Template Context (use merge fields, not actual values):
- Example Customer Name: ${jobDetails.customerName} → Use {{customerName}} in template
- Example Service: ${jobDetails.serviceType || 'plumbing service'} → Use {{serviceType}} in template
- Example Job Amount: ${jobDetails.jobAmount ? `$${(jobDetails.jobAmount / 100).toFixed(2)}` : 'varies'} → Use {{jobAmount}} in template
- Example Location: ${jobDetails.location || 'Central Texas'} → Use {{location}} in template

IMPORTANT: Create a TEMPLATE using {{merge_fields}}, not a personalized email with hardcoded values!

Email Objectives:
${emailNumber === 1 ? `
- Thank customer for choosing Economy Plumbing
- Emphasize quality of service provided
- Make leaving a review EASY (mention Google, Facebook, direct links)
- Light ask, not pushy
` : emailNumber === 2 ? `
- Gentle reminder about review request
- Emphasize how feedback helps improve service
- Show appreciation for their business
- Mention we're always here if they need anything
` : emailNumber === 3 ? `
- Social proof: mention that other customers love sharing experiences
- Explain how reviews help local families find great plumbers
- Still friendly, slightly more direct
- Offer to address any concerns if they haven't reviewed
` : `
- Final gentle reminder
- Express that we'd love to hear their feedback
- Last chance framing (but warm, not desperate)
- Thank them regardless of whether they review
`}

${phoneNumber ? `IMPORTANT: Include the phone number ${phoneNumber} in the email signature for tracking purposes. Format: "Questions? Call us at ${phoneNumber}"` : ''}

Include a clear CTA button with text like "Leave a Review" that links to: https://plumbersthatcare.com/leave-review

CRITICAL UTM TRACKING REQUIREMENT:
ALL links in the email MUST include UTM parameters for attribution tracking:
- utm_source=review_request_email
- utm_medium=email
- utm_campaign=review_drip_email_${emailNumber}

Example: https://plumbersthatcare.com/leave-review?utm_source=review_request_email&utm_medium=email&utm_campaign=review_drip_email_${emailNumber}

Apply these UTM parameters to ALL website links in the email (buttons, text links, footer links, etc.).

Generate:
1. Subject line (under 50 chars, ${strategy} focused)
2. Preheader text (40-80 chars)
3. HTML email body (well-formatted, professional, mobile-friendly)
4. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}
`;
  } else if (campaignType === 'referral_nurture') {
    userPrompt = `
Generate a referral nurture email with these specifications:

Campaign Details:
- Type: Referral Nurture Campaign
- ${emailSequence} in sequence (sent ${daysFromJob} days after positive review)
- Strategy: ${strategy}
- NOTE: Do NOT include seasonal context in template - it will be added dynamically when sending

Template Context (use merge fields, not actual values):
- Example Customer Name: ${jobDetails.customerName} → Use {{customerName}} in template
- Example Service: ${jobDetails.serviceType || 'plumbing service'} → Use {{serviceType}} in template
- Example Location: ${jobDetails.location || 'Central Texas'} → Use {{location}} in template

IMPORTANT: Create a TEMPLATE using {{merge_fields}}, not a personalized email with hardcoded values!

Referral Program Details:
- Referrer earns $25 account credit for each successful referral
- Referee gets quality service from trusted local plumber
- Simple process: share unique link or referral code

Email Objectives:
${emailNumber === 1 ? `
- Introduce referral program (they left positive review, so they're happy!)
- Explain $25 credit reward per referral
- Make it EASY to share (unique link, simple process)
- Focus on helping friends/family find great plumber
- Mention referral link available in customer portal
` : emailNumber === 2 ? `
- Gentle reminder about referral program
- Emphasize helping friends/neighbors
- Share that they're earning rewards for referrals
- Maybe include a mini success story
- Reinforce trust and quality service
` : emailNumber === 3 ? `
- Social proof: mention how many customers have referred friends
- Success stories from referral program
- Emphasize community benefit (helping local families)
- Reminder of $25 per referral reward
` : `
- Final touch: opportunity still available
- Soft close with appreciation
- Thank them for being valued customer
- Leave door open for future referrals
- No pressure, just gratitude
`}

${phoneNumber ? `IMPORTANT: Include the phone number ${phoneNumber} in the email signature for tracking purposes. Format: "Questions? Call us at ${phoneNumber}"` : ''}

${referralLink ? `CRITICAL: Include their unique referral link in the email: ${referralLink}

Instructions for including the referral link:
- Prominently display their referral link: ${referralLink}
- Explain they can share this link with friends, family, and neighbors
- When someone books service through their link, they earn $25 credit
- Make the link easy to copy and share (formatted as clickable button and also plain text)
- Include a clear CTA button that links to: ${referralLink}` : `CRITICAL: Tell them to visit https://plumbersthatcare.com/customer-portal to get their personalized referral link. Include a CTA button that links to: https://plumbersthatcare.com/customer-portal`}

CRITICAL UTM TRACKING REQUIREMENT:
ALL links to plumbersthatcare.com in the email MUST include UTM parameters for attribution tracking:
- utm_source=referral_nurture_email
- utm_medium=email
- utm_campaign=referral_drip_email_${emailNumber}

Example for customer portal link: https://plumbersthatcare.com/customer-portal?utm_source=referral_nurture_email&utm_medium=email&utm_campaign=referral_drip_email_${emailNumber}

Apply these UTM parameters to ALL plumbersthatcare.com links (buttons, text links, footer links, etc.).
NOTE: Do NOT add UTM parameters to the unique referral link ${referralLink || ''} - only to regular website links.

Generate:
1. Subject line (under 50 chars, ${strategy} focused)
2. Preheader text (40-80 chars)
3. HTML email body (well-formatted, professional, mobile-friendly, includes referral link instructions)
4. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}
`;
  } else {
    // quote_followup campaign
    userPrompt = `
Generate a quote follow-up email with these specifications:

Campaign Details:
- Type: Quote Follow-up Campaign (for customers who received estimate but no work completed)
- ${emailSequence} in sequence (sent ${daysFromJob} days after quote/estimate)
- Strategy: ${strategy}
- NOTE: Do NOT include seasonal context in template - it will be added dynamically when sending

Template Context (use merge fields, not actual values):
- Example Customer Name: ${jobDetails.customerName} → Use {{customerName}} in template
- Example Service: ${jobDetails.serviceType || 'plumbing service'} → Use {{serviceType}} in template
- Example Location: ${jobDetails.location || 'Central Texas'} → Use {{location}} in template

IMPORTANT: Create a TEMPLATE using {{merge_fields}}, not a personalized email with hardcoded values!

Important Context:
- This customer received a quote/estimate but NO WORK WAS DONE (invoice was $0)
- We want to stay top-of-mind for when they're ready to move forward
- Focus on nurturing the relationship, not pressuring them
- If they appreciated our professionalism during the estimate, that's worth mentioning

Email Objectives:
${emailNumber === 1 ? `
- Thank them for considering Economy Plumbing
- Acknowledge that they received a quote but haven't moved forward yet
- Let them know we're here when they're ready
- Soft ask: if they appreciated our professionalism during the quote, we'd love to hear about it
- NO PRESSURE - just staying in touch
` : emailNumber === 2 ? `
- Gentle check-in: "Just following up on your estimate"
- Offer help: "Do you have any questions about the quote?"
- Reinforce our value: quality work, fair pricing, family-owned
- Mention we're always here to help, even with questions
- Build trust and stay top-of-mind
` : emailNumber === 3 ? `
- Seasonal reminder: ${seasonalContext}
- Timely service recommendation based on season
- Educational value: why this service matters now
- Still warm and helpful, not salesy
- "When you're ready, we're here"
` : `
- Final soft touch: limited-time seasonal offer or discount (if appropriate)
- Express appreciation for their consideration
- Leave door open: "We hope to earn your business in the future"
- Include testimonial or social proof
- Thank them regardless of whether they book
`}

${phoneNumber ? `IMPORTANT: Include the phone number ${phoneNumber} in the email signature for tracking purposes. Format: "Questions? Call us at ${phoneNumber}"` : ''}

Include a clear CTA button with text like "Get a Quote" or "Schedule Service" that links to: https://plumbersthatcare.com/contact

CRITICAL UTM TRACKING REQUIREMENT:
ALL links in the email MUST include UTM parameters for attribution tracking:
- utm_source=quote_followup_email
- utm_medium=email
- utm_campaign=quote_followup_drip_email_${emailNumber}

Example: https://plumbersthatcare.com/contact?utm_source=quote_followup_email&utm_medium=email&utm_campaign=quote_followup_drip_email_${emailNumber}

Apply these UTM parameters to ALL website links in the email (buttons, text links, footer links, etc.).

Generate:
1. Subject line (under 50 chars, ${strategy} focused, NOT pushy)
2. Preheader text (40-80 chars)
3. HTML email body (well-formatted, professional, mobile-friendly)
4. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}
`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    const parsed = JSON.parse(content);
    
    return {
      subject: parsed.subject,
      preheader: parsed.preheader,
      bodyHtml: parsed.bodyHtml,
      bodyPlain: parsed.bodyPlain,
      strategy,
      seasonalContext: `${season}: ${seasonalContext}`
    };
  } catch (error: any) {
    console.error('[AI Email Generator] Error:', error);
    throw new Error(`Failed to generate email: ${error.message}`);
  }
}

/**
 * Regenerate email with different strategy or emphasis
 */
export async function regenerateEmail(
  previousEmail: GeneratedEmail,
  options: GenerateEmailOptions,
  feedback: string
): Promise<GeneratedEmail> {
  // Call generate with modified prompt including feedback
  const regenerateOptions = {
    ...options,
    // Could add feedback to the prompt here
  };
  
  return await generateEmail(regenerateOptions);
}

/**
 * Generate referee welcome email
 * Sent immediately when someone is referred to Economy Plumbing
 */
export async function generateRefereeWelcomeEmail(options: {
  refereeName: string;
  referrerName: string;
  phoneNumber?: string;
}): Promise<{ subject: string; bodyHtml: string; bodyPlain: string }> {
  const { refereeName, referrerName, phoneNumber } = options;
  const { season, context: seasonalContext } = getSeasonalContext();

  const systemPrompt = `You are an expert email copywriter for Economy Plumbing Services, a family-owned plumbing company serving Austin and Central Texas.

Brand Voice:
- Friendly, professional, and trustworthy
- Texas-local feel (but not overly "y'all")
- Focus on quality service and customer relationships
- Value honesty and transparency
- Family-owned business for 20+ years

Email Guidelines:
- Keep subject lines under 50 characters, compelling and personal
- Use HTML formatting with proper structure
- Include clear call-to-action buttons
- Mobile-friendly layout
- Warm welcome tone - they were referred by a friend
- ${phoneNumber ? `Include phone number ${phoneNumber} for tracking` : 'No phone number tracking'}`;

  const userPrompt = `Generate a welcome email for a new referee with these specifications:

Campaign Details:
- Type: Referee Welcome Email
- Sent immediately when someone is referred to Economy Plumbing
- Purpose: Warm introduction and make booking easy
- Season: ${season}
- Seasonal Context: ${seasonalContext}

Recipient Details:
- Name: ${refereeName}
- Referred by: ${referrerName} (their friend/family member)

Email Objectives:
- Thank them for trusting the referral from ${referrerName}
- Welcome them to the Economy Plumbing family
- Emphasize personal touch: friend recommended us, we'll take great care of them
- Make scheduling service EASY (include phone number and online scheduler link)
- Brief mention of services: water heaters, drain cleaning, leak repair, emergency service
- Mention 20+ years serving Central Texas families
- Professional but warm tone - this is a friend-to-friend referral

${phoneNumber ? `IMPORTANT: Include the phone number ${phoneNumber} in the email for tracking purposes. Format: "Ready to schedule? Call us at ${phoneNumber}"` : ''}

Include a clear CTA button with text like "Schedule Service Now" that links to: https://plumbersthatcare.com/schedule

${seasonalContext ? `Seasonal touch: ${seasonalContext}` : ''}

Generate:
1. Subject line (under 50 chars, friendly and welcoming)
2. HTML email body (well-formatted, professional, mobile-friendly)
3. Plain text version (clean, readable)

Return as JSON:
{
  "subject": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    const parsed = JSON.parse(content);
    
    return {
      subject: parsed.subject,
      bodyHtml: parsed.bodyHtml,
      bodyPlain: parsed.bodyPlain,
    };
  } catch (error: any) {
    console.error('[AI Email Generator] Error generating referee welcome email:', error);
    throw new Error(`Failed to generate referee welcome email: ${error.message}`);
  }
}

/**
 * Personalize an email template for a specific customer
 * This function takes a template with merge fields and job data, then uses AI to:
 * 1. Replace merge fields with actual customer data
 * 2. Analyze the job details to add personalized touches
 * 3. Generate context-aware content based on the specific work done
 */
export async function personalizeEmailForCustomer(options: {
  template: {
    subject: string;
    htmlContent: string;
    plainTextContent: string | null;
    preheader?: string | null;
  };
  jobData: {
    customerName: string;
    serviceType?: string;
    jobAmount?: number;
    jobDate?: Date;
    location?: string;
    jobDescription?: string;
    estimateDetails?: string;
    workCompleted?: string;
    customerHistory?: Array<{
      date: Date;
      service: string;
      amount: number;
      notes?: string;
    }>;
    totalJobsCompleted?: number;
    isRepeatCustomer?: boolean;
  };
  campaignType: 'review_request' | 'referral_nurture' | 'quote_followup';
  phoneNumber?: string;
  referralLink?: string;
}): Promise<{ subject: string; preheader: string; bodyHtml: string; bodyPlain: string }> {
  const { template, jobData, campaignType, phoneNumber, referralLink } = options;
  const { season, context: seasonalContext } = getSeasonalContext();

  const systemPrompt = `You are an expert email personalizer for Economy Plumbing Services.

Your task is to take an approved email TEMPLATE and personalize it for a specific customer using their real job data, history, and current seasonal context.

CRITICAL RULES:
1. Keep the overall structure, tone, and CTAs from the template
2. Replace merge fields ({{customerName}}, {{serviceType}}, etc.) with actual data
3. Add personalized touches based on the specific work done AND customer history
4. Analyze job details AND past jobs to make references feel genuine and specific
5. Add seasonal context relevant to RIGHT NOW (${season})
6. Generate a compelling, personalized preheader text (40-80 chars)
7. Maintain the professional, friendly brand voice
8. DO NOT change URLs, phone numbers, or key messaging from the template
9. The admin approved the template structure - respect it

Current Season & Context:
- Season: ${season}
- Seasonal Context: ${seasonalContext}
- Use this to add timely, relevant seasonal messaging

Customer Information:
- Name: ${jobData.customerName}
- Location: ${jobData.location || 'Central Texas'}
${jobData.isRepeatCustomer ? `- REPEAT CUSTOMER (${jobData.totalJobsCompleted || 'multiple'} jobs completed)` : '- First-time customer'}

Current Job/Estimate:
- Service Type: ${jobData.serviceType || 'plumbing service'}
- Job Amount: ${jobData.jobAmount ? `$${(jobData.jobAmount / 100).toFixed(2)}` : 'N/A'}
- Job Date: ${jobData.jobDate ? jobData.jobDate.toLocaleDateString() : 'recent'}
${jobData.jobDescription ? `- Job Description: ${jobData.jobDescription}` : ''}
${jobData.estimateDetails ? `- Estimate Details: ${jobData.estimateDetails}` : ''}
${jobData.workCompleted ? `- Work Completed: ${jobData.workCompleted}` : ''}

${jobData.customerHistory && jobData.customerHistory.length > 0 ? `
Customer History (Previous Jobs):
${jobData.customerHistory.map((job, i) => 
  `${i + 1}. ${job.date.toLocaleDateString()}: ${job.service} ($${(job.amount / 100).toFixed(2)})${job.notes ? ` - ${job.notes}` : ''}`
).join('\n')}

IMPORTANT: Reference their history to build rapport and show you remember them!
` : 'No previous job history - this is their first interaction with us'}

Campaign Type: ${campaignType}`;

  const userPrompt = `Personalize this email template for ${jobData.customerName}:

TEMPLATE SUBJECT: ${template.subject}
TEMPLATE PREHEADER: ${template.preheader || 'Generate one based on content'}

TEMPLATE HTML BODY:
${template.htmlContent}

TEMPLATE PLAIN TEXT:
${template.plainTextContent || 'N/A'}

Instructions:
1. Replace all merge fields with actual customer data:
   - {{customerName}} → ${jobData.customerName}
   - {{serviceType}} → ${jobData.serviceType || 'plumbing service'}
   - {{jobAmount}} → ${jobData.jobAmount ? `$${(jobData.jobAmount / 100).toFixed(2)}` : 'varies'}
   - {{location}} → ${jobData.location || 'Central Texas'}
   - {{jobDate}} → ${jobData.jobDate ? jobData.jobDate.toLocaleDateString() : 'recently'}

2. Add SEASONAL CONTEXT based on current season (${season}):
   - Reference seasonal plumbing needs: ${seasonalContext}
   - Make it feel timely and relevant to RIGHT NOW
   - This is WHY templates don't have seasonal content - you add it dynamically!

3. Analyze customer history and job details for personalization:
   ${jobData.isRepeatCustomer ? '- Acknowledge they\'re a valued repeat customer' : '- Welcome them as a new customer'}
   ${jobData.customerHistory && jobData.customerHistory.length > 0 ? `- Reference their previous work (e.g., "last year's water heater installation")` : ''}
   ${jobData.jobDescription ? `- Reference the specific work: ${jobData.jobDescription}` : ''}
   ${jobData.estimateDetails ? `- Mention estimate details naturally: ${jobData.estimateDetails}` : ''}
   ${jobData.workCompleted ? `- Acknowledge completed work: ${jobData.workCompleted}` : ''}

4. Generate a compelling PREHEADER TEXT (40-80 chars):
   - Personalized for this specific customer
   - Complements the subject line
   - Creates curiosity or urgency

5. Keep the template structure, CTAs, and brand voice
6. Make it feel like it was written specifically for THIS customer, RIGHT NOW
7. ${phoneNumber ? `Ensure phone number ${phoneNumber} is included for tracking` : 'Use standard phone number'}
8. ${referralLink ? `Include their unique referral link: ${referralLink}` : ''}

Return as JSON:
{
  "subject": "...",
  "preheader": "...",
  "bodyHtml": "...",
  "bodyPlain": "..."
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    const parsed = JSON.parse(content);
    
    return {
      subject: parsed.subject,
      preheader: parsed.preheader,
      bodyHtml: parsed.bodyHtml,
      bodyPlain: parsed.bodyPlain,
    };
  } catch (error: any) {
    console.error('[AI Email Personalizer] Error:', error);
    throw new Error(`Failed to personalize email: ${error.message}`);
  }
}

/**
 * Generate AI-powered thank you email for referrer (sent when they submit a referral)
 */
export async function generateReferrerThankYouEmail(
  options: {
    referrerName: string;
    refereeName: string;
    phoneNumber?: string;
  },
  customPrompt?: string,
  brandGuidelines?: string
): Promise<{ subject: string; bodyHtml: string; bodyPlain: string }> {
  const { referrerName, refereeName, phoneNumber } = options;
  const { season, context: seasonalContext } = getSeasonalContext();

  const defaultSystemPrompt = `You are an AI email writer for Economy Plumbing Services, a trusted Austin-area plumbing company.

Your task is to generate a warm, appreciative thank you email to a customer who just submitted a referral.

CRITICAL RULES:
1. Express genuine gratitude for the referral
2. Explain the referral reward clearly ($25 credit per successful referral)
3. Let them know what happens next (we'll reach out to their friend)
4. Remind them they can refer multiple people
5. Keep it short, warm, and personal (not salesy)
6. Use Austin/Texas-friendly language
7. Include clear contact info using the placeholder {{trackingNumber}} for phone number
8. Make them feel valued and appreciated
9. Professional but friendly tone
10. Mobile-optimized HTML (works on all devices)
11. IMPORTANT: Always use {{trackingNumber}} as the phone number placeholder - it will be replaced with the campaign-specific tracking number

Email Structure:
- Subject line: Personal, grateful, clear benefit mentioned
- Opening: Thank them by name for the specific referral
- Body: Explain next steps, reward details, encourage more referrals
- Closing: Gratitude + easy way to contact us
- Call to Action: Refer more friends (make it easy)

Brand Voice:
- Friendly, trustworthy, professional
- Austin/Central Texas local feel
- Family-owned business vibe
- Helpful and approachable
- No pushy sales language

Seasonal Context (${season}):
${seasonalContext}
- Use this to add a timely seasonal touch if relevant

${brandGuidelines ? `\nADDITIONAL BRAND GUIDELINES:\n${brandGuidelines}` : ''}
${customPrompt ? `\nCUSTOM INSTRUCTIONS:\n${customPrompt}` : ''}`;

  const systemPrompt = defaultSystemPrompt;

  const userPrompt = `Generate a thank you email for ${referrerName} who just referred ${refereeName}.

Key Details:
- Referrer: ${referrerName}
- Person they referred: ${refereeName}
- Reward: $25 credit for each successful referral (when referred friend becomes a customer)
- Phone: {{trackingNumber}} (use this exact placeholder - do not replace it)
- Website: plumbersthatcare.com
- Current Season: ${season}

Requirements:
1. Thank ${referrerName} personally for referring ${refereeName}
2. Explain we'll reach out to ${refereeName} soon
3. Clarify the reward: $25 credit after ${refereeName} becomes a customer
4. Mention credits are valid for 1 year
5. Encourage them to refer more friends (each one = another $25)
6. Make them feel appreciated and valued
7. Include clear contact information
8. Add a subtle seasonal touch based on current season (${season})
9. Keep it warm and personal, not corporate

CRITICAL UTM TRACKING REQUIREMENT:
ALL links to plumbersthatcare.com in the email MUST include UTM parameters for attribution tracking:
- utm_source=referral_thank_you_email
- utm_medium=email
- utm_campaign=referral_thankyou

Example: https://plumbersthatcare.com/customer-portal?utm_source=referral_thank_you_email&utm_medium=email&utm_campaign=referral_thankyou

Apply these UTM parameters to ALL website links in the email (buttons, text links, footer links, etc.).

Return as JSON:
{
  "subject": "Thank you for referring ${refereeName}!",
  "bodyHtml": "Mobile-optimized HTML email",
  "bodyPlain": "Plain text version"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    const parsed = JSON.parse(content);
    
    return {
      subject: parsed.subject,
      bodyHtml: parsed.bodyHtml,
      bodyPlain: parsed.bodyPlain,
    };
  } catch (error: any) {
    console.error('[AI Email Generator] Error generating referrer thank you email:', error);
    throw new Error(`Failed to generate referrer thank you email: ${error.message}`);
  }
}

/**
 * Generate AI-powered success notification for referrer (sent when referee completes first job)
 */
export async function generateReferrerSuccessEmail(
  options: {
    referrerName: string;
    refereeName: string;
    creditAmount: number; // In dollars (e.g., 25.00)
    creditExpiresAt: Date;
    currentBalance?: number; // Total available credits in dollars
    phoneNumber?: string;
  },
  customPrompt?: string,
  brandGuidelines?: string
): Promise<{ subject: string; bodyHtml: string; bodyPlain: string }> {
  const { referrerName, refereeName, creditAmount, creditExpiresAt, currentBalance, phoneNumber } = options;
  const { season, context: seasonalContext } = getSeasonalContext();

  const defaultSystemPrompt = `You are an AI email writer for Economy Plumbing Services, a trusted Austin-area plumbing company.

Your task is to generate an exciting congratulatory email to a customer whose referral just converted (their friend became a customer).

CRITICAL RULES:
1. Lead with celebration - their referral succeeded!
2. Clearly state the credit amount earned
3. Show their total available credit balance if provided
4. Explain credit expiration clearly
5. Encourage them to refer more friends
6. Make them feel successful and appreciated
7. Include easy next steps (how to use credit, refer more)
8. Professional but exciting tone
9. Mobile-optimized HTML
10. Create urgency to use credits before expiration
11. IMPORTANT: Always use {{trackingNumber}} as the phone number placeholder - it will be replaced with the campaign-specific tracking number

Email Structure:
- Subject: Exciting news, credit confirmed
- Opening: Congratulate them on successful referral
- Body: Credit details, total balance, expiration, encourage more referrals
- Closing: How to use credits + easy referral process
- Call to Action: Schedule service to use credit OR refer another friend

Brand Voice:
- Celebratory and positive
- Austin/Central Texas local feel
- Family-owned business vibe
- Grateful for their support
- Encouraging without being pushy

Seasonal Context (${season}):
${seasonalContext}
- Use this to suggest seasonal services they could use their credit on

${brandGuidelines ? `\nADDITIONAL BRAND GUIDELINES:\n${brandGuidelines}` : ''}
${customPrompt ? `\nCUSTOM INSTRUCTIONS:\n${customPrompt}` : ''}`;

  const systemPrompt = defaultSystemPrompt;

  const userPrompt = `Generate a success notification for ${referrerName} - their referral (${refereeName}) just became a customer!

Key Details:
- Referrer: ${referrerName}
- Successful referral: ${refereeName}
- Credit earned: $${creditAmount.toFixed(2)}
${currentBalance !== undefined ? `- Total available credits: $${currentBalance.toFixed(2)}` : ''}
- Credit expires: ${creditExpiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
- Phone: {{trackingNumber}} (use this exact placeholder - do not replace it)
- Website: plumbersthatcare.com
- Current Season: ${season}

Requirements:
1. Congratulate ${referrerName} - ${refereeName} is now a customer!
2. Clearly state they earned $${creditAmount.toFixed(2)} credit
3. ${currentBalance !== undefined ? `Show total available balance: $${currentBalance.toFixed(2)}` : 'Mention this is their referral credit'}
4. Explain credits expire on ${creditExpiresAt.toLocaleDateString()}
5. Encourage them to:
   a) Use their credit on upcoming service (suggest seasonal services based on ${season})
   b) Refer more friends to earn more credits
6. Make them feel successful and appreciated
7. Include clear contact information
8. Add seasonal context for services they could use credit on
9. Create gentle urgency about credit expiration without being pushy
10. Make referring more friends easy and appealing

CRITICAL UTM TRACKING REQUIREMENT:
ALL links to plumbersthatcare.com in the email MUST include UTM parameters for attribution tracking:
- utm_source=referral_success_email
- utm_medium=email
- utm_campaign=referral_success

Example: https://plumbersthatcare.com/schedule?utm_source=referral_success_email&utm_medium=email&utm_campaign=referral_success

Apply these UTM parameters to ALL website links in the email (buttons, text links, footer links, etc.).

Tone: Celebratory, grateful, encouraging

Return as JSON:
{
  "subject": "Great news! You earned $${creditAmount.toFixed(2)} in referral credit",
  "bodyHtml": "Mobile-optimized HTML email",
  "bodyPlain": "Plain text version"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from AI');
    }

    const parsed = JSON.parse(content);
    
    return {
      subject: parsed.subject,
      bodyHtml: parsed.bodyHtml,
      bodyPlain: parsed.bodyPlain,
    };
  } catch (error: any) {
    console.error('[AI Email Generator] Error generating referrer success email:', error);
    throw new Error(`Failed to generate referrer success email: ${error.message}`);
  }
}
