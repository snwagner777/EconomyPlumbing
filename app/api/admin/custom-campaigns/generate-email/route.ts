import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

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

    const { campaignId, strategy, campaignDescription } = await req.json();

    if (!campaignId || !campaignDescription) {
      return NextResponse.json(
        { error: "Campaign ID and description are required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build prompt based on strategy
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
      default:
        strategyGuide = 'Use best practices for engagement and conversion.';
    }

    const prompt = `You are an expert email marketing copywriter for Economy Plumbing Services, a professional plumbing company in Austin, TX.

Campaign Goal: ${campaignDescription}
Strategy: ${strategyGuide}

Generate a professional, engaging email that:
1. Has a compelling subject line (40-60 characters)
2. Includes a preheader text (80-120 characters)
3. Uses professional but friendly tone
4. Is mobile-friendly and scannable
5. Includes a clear call-to-action
6. Follows email marketing best practices
7. Uses proper HTML formatting with responsive design

Business Context:
- Company: Economy Plumbing Services
- Location: Austin, TX (serving Central Texas)
- Specialties: Residential & commercial plumbing, water heaters, drain cleaning, leak detection
- Brand Voice: Professional, trustworthy, customer-focused

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
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    // Parse JSON response
    const cleanedContent = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const emailData = JSON.parse(cleanedContent);

    return NextResponse.json(emailData);
  } catch (error: any) {
    console.error("Error generating AI email:", error);
    return NextResponse.json(
      { error: "Failed to generate email with AI" },
      { status: 500 }
    );
  }
}
