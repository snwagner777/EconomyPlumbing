import OpenAI from "openai";
import type { CustomerSegment } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EmailContent {
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent: string;
}

interface SMSContent {
  message: string;
  callToAction: string;
}

interface NewsletterContent {
  subject: string;
  htmlContent: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

/**
 * Generate email campaign content for a customer segment
 */
export async function generateEmailCampaignContent(segment: CustomerSegment): Promise<EmailContent> {
  const prompt = `You are an expert email marketer for Economy Plumbing Services, a professional plumbing company.

Create a targeted email campaign for the following customer segment:
- Segment Name: ${segment.name}
- Description: ${segment.description}
- Target Criteria: ${JSON.stringify(segment.targetCriteria, null, 2)}
${segment.aiReasoning ? `- AI Reasoning: ${segment.aiReasoning}` : ''}

Requirements:
1. Subject line should be compelling and under 50 characters
2. Include a clear call-to-action
3. Personalize the message based on the segment characteristics
4. Mention specific services relevant to this segment
5. Include urgency if appropriate
6. Professional yet friendly tone

Return a JSON object with:
{
  "subject": "compelling subject line",
  "preheader": "preview text (optional)",
  "htmlContent": "complete HTML email with inline styles",
  "textContent": "plain text version"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email marketing specialist for a plumbing services company. Create compelling, conversion-focused email content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    
    // Add tracking pixels and phone number tracking
    const trackingPhone = "469-PLUMBER"; // This would be dynamically assigned
    content.htmlContent = content.htmlContent.replace(/469-\d{3}-\d{4}/g, trackingPhone);
    
    return {
      subject: content.subject || "Special Offer from Economy Plumbing",
      preheader: content.preheader,
      htmlContent: content.htmlContent || "<p>Email content generation failed</p>",
      textContent: content.textContent || "Email content generation failed",
    };
  } catch (error) {
    console.error("[AI Campaign Generator] Email generation error:", error);
    throw new Error("Failed to generate email campaign content");
  }
}

/**
 * Generate SMS campaign content for a customer segment
 */
export async function generateSMSCampaignContent(segment: CustomerSegment): Promise<SMSContent> {
  const prompt = `You are an expert SMS marketer for Economy Plumbing Services.

Create a targeted SMS message for the following customer segment:
- Segment Name: ${segment.name}
- Description: ${segment.description}
- Target Criteria: ${JSON.stringify(segment.targetCriteria, null, 2)}

Requirements:
1. Message must be under 160 characters (SMS limit)
2. Include clear call-to-action
3. Be direct and compelling
4. Include urgency if appropriate
5. TCPA compliant (include opt-out)

Return a JSON object with:
{
  "message": "complete SMS message under 160 chars including opt-out",
  "callToAction": "primary action (e.g., 'Call Now', 'Book Online')"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an SMS marketing specialist. Create concise, compelling messages under 160 characters that drive action.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure message includes opt-out
    if (!content.message.includes("Reply STOP")) {
      content.message = content.message.substring(0, 140) + " Reply STOP to opt out";
    }
    
    return {
      message: content.message || "Special offer! Call 469-PLUMBER today. Reply STOP to opt out.",
      callToAction: content.callToAction || "Call Now",
    };
  } catch (error) {
    console.error("[AI Campaign Generator] SMS generation error:", error);
    throw new Error("Failed to generate SMS campaign content");
  }
}

/**
 * Generate newsletter content for a customer segment
 */
export async function generateNewsletterContent(segment: CustomerSegment): Promise<NewsletterContent> {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentSeason = getCurrentSeason();
  
  const prompt = `You are a content creator for Economy Plumbing Services' monthly newsletter.

Create a newsletter for the following customer segment:
- Segment Name: ${segment.name}
- Description: ${segment.description}
- Month: ${currentMonth}
- Season: ${currentSeason}

Newsletter Requirements:
1. Include seasonal plumbing tips
2. Feature 2-3 relevant service highlights
3. Include a customer success story placeholder
4. Add home maintenance advice
5. Include special offers relevant to this segment
6. Professional yet friendly tone

Return a JSON object with:
{
  "subject": "newsletter subject line",
  "htmlContent": "complete HTML newsletter with sections",
  "sections": [
    {
      "title": "section title",
      "content": "section content"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a newsletter content creator for a plumbing services company. Create informative, valuable content that builds trust and drives engagement.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    
    // Create HTML template with Economy Plumbing branding
    const htmlTemplate = createNewsletterTemplate(content);
    
    return {
      subject: content.subject || `${currentMonth} Plumbing Tips & Savings`,
      htmlContent: htmlTemplate,
      sections: content.sections || [],
    };
  } catch (error) {
    console.error("[AI Campaign Generator] Newsletter generation error:", error);
    throw new Error("Failed to generate newsletter content");
  }
}

/**
 * Create branded newsletter HTML template
 */
function createNewsletterTemplate(content: any): string {
  const sections = content.sections || [];
  
  let sectionsHtml = sections.map((section: any) => `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #1e40af; font-size: 24px; margin-bottom: 10px;">${section.title}</h2>
      <div style="color: #333; line-height: 1.6;">
        ${section.content}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background-color: #1e40af; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">Economy Plumbing Services</h1>
      <p style="color: #93c5fd; margin: 10px 0 0 0;">Your Trusted Plumbing Partner</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      ${sectionsHtml}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://economyplumbingservices.com/schedule" 
           style="display: inline-block; padding: 15px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Schedule Service Today
        </a>
      </div>
      
      <!-- Contact Info -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center; color: #6b7280;">
        <p>Questions? Call us at <strong>469-PLUMBER</strong></p>
        <p>Available 24/7 for Emergency Service</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
      <p>© 2024 Economy Plumbing Services. All rights reserved.</p>
      <p>
        <a href="[unsubscribe]" style="color: #3b82f6;">Unsubscribe</a> | 
        <a href="https://economyplumbingservices.com/privacy" style="color: #3b82f6;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get current season for seasonal marketing
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

/**
 * Generate marketing recommendations for a segment
 */
export async function generateMarketingRecommendations(segment: CustomerSegment): Promise<string[]> {
  const prompt = `Based on this customer segment, provide 3-5 specific marketing action recommendations:
- Segment: ${segment.name}
- Description: ${segment.description}

Return a JSON array of actionable recommendations.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a marketing strategist. Provide specific, actionable recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.recommendations || [
      "Send targeted email campaign within 48 hours",
      "Follow up with phone calls to high-value customers",
      "Create limited-time offer for this segment",
    ];
  } catch (error) {
    console.error("[AI Campaign Generator] Recommendations error:", error);
    return ["Contact this segment with relevant offers"];
  }
}