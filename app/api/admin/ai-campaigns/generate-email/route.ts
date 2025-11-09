import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { generateEmail } from '@/server/lib/aiEmailGenerator';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    
    if (!(session as any).userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { subtype, strategy, description } = await req.json();

    if (!subtype || !description) {
      return NextResponse.json(
        { error: "Campaign subtype and description are required" },
        { status: 400 }
      );
    }

    // Use unified AI generation for all email types
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let strategyGuide = '';
    switch (strategy) {
      case 'value':
        strategyGuide = 'Focus on the unique value proposition and benefits for the customer.';
        break;
      case 'trust':
        strategyGuide = 'Build trust through credibility, testimonials, and reliability messaging.';
        break;
      case 'urgency':
        strategyGuide = 'Create urgency with time-sensitive offers or limited availability.';
        break;
      case 'social_proof':
        strategyGuide = 'Highlight customer success stories, reviews, and social proof.';
        break;
      case 'educational':
        strategyGuide = 'Provide educational content that helps customers make informed decisions.';
        break;
      case 'seasonal':
        strategyGuide = 'Leverage seasonal context and timely messaging for relevance.';
        break;
      default:
        strategyGuide = 'Use best practices for engagement and conversion.';
    }

    // Build campaign-specific context
    let campaignContext = '';
    let utmCampaign = 'custom';
    
    switch (subtype) {
      case 'review_request':
        campaignContext = `This is a REVIEW REQUEST email. The goal is to encourage satisfied customers to leave positive reviews on Google or Facebook. Make it easy and emphasize how reviews help local families find great plumbers.`;
        utmCampaign = 'review_request';
        break;
      case 'referral_nurture':
        campaignContext = `This is a REFERRAL NURTURE email. The goal is to encourage happy customers to refer friends/family. Mention the $25 credit reward per referral and emphasize helping neighbors find trustworthy service.`;
        utmCampaign = 'referral_nurture';
        break;
      case 'quote_followup':
        campaignContext = `This is a QUOTE FOLLOW-UP email. The customer received an estimate but hasn't booked yet. Stay top-of-mind without being pushy. Offer help with questions and emphasize our quality/trustworthiness.`;
        utmCampaign = 'quote_followup';
        break;
      case 'custom':
      default:
        campaignContext = `This is a CUSTOM email campaign.`;
        utmCampaign = 'custom';
        break;
    }

    const prompt = `You are an expert email marketing copywriter for Economy Plumbing Services, a professional plumbing company in Austin, TX.

Campaign Type: ${campaignContext}
Campaign Goal: ${description}
Strategy: ${strategyGuide}

Generate a professional, engaging email that:
1. Has a compelling subject line (40-60 characters)
2. Includes a preheader text (80-120 characters)
3. Uses professional but friendly tone
4. Is mobile-friendly and scannable
5. Includes a clear call-to-action
6. Follows email marketing best practices
7. Uses proper HTML formatting with responsive design
8. Includes UTM tracking parameters in all links (utm_source=ai_campaign&utm_medium=email&utm_campaign=${utmCampaign})
9. Aligns with the campaign type goals AND the specific campaign goal described above

Business Context:
- Company: Economy Plumbing Services
- Location: Austin, TX (serving Central Texas)
- Specialties: Residential & commercial plumbing, water heaters, drain cleaning, leak detection
- Brand Voice: Professional, trustworthy, customer-focused, family-owned for 20+ years
- Contact: (512) 877-8234, plumbersthatcare.com

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "subject": "Your compelling subject line",
  "preheader": "Your preheader text",
  "htmlContent": "Full HTML email body with inline CSS",
  "plainTextContent": "Plain text version of the email"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email marketing copywriter. Return ONLY valid JSON, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    const emailData = JSON.parse(content);
    
    return NextResponse.json({
      subject: emailData.subject,
      preheader: emailData.preheader,
      htmlContent: emailData.htmlContent,
      plainTextContent: emailData.plainTextContent,
      strategy,
    });

  } catch (error: any) {
    console.error("Error generating AI email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate email with AI" },
      { status: 500 }
    );
  }
}
