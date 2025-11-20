import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getFallbackPhoneNumber } from '@/server/lib/phoneNumbers';
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

    const { strategy, description } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Campaign description is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Get fallback phone number for AI prompt
    const fallbackPhone = await getFallbackPhoneNumber();

    let strategyGuide = '';
    switch (strategy) {
      case 'value':
        strategyGuide = 'Focus on the unique value proposition and benefits. Keep it concise and compelling.';
        break;
      case 'trust':
        strategyGuide = 'Build trust through credibility and reliability. Emphasize family-owned, local business.';
        break;
      case 'urgency':
        strategyGuide = 'Create urgency with time-sensitive offers or limited availability. Be direct but not pushy.';
        break;
      case 'social_proof':
        strategyGuide = 'Mention customer reviews, ratings, or testimonials briefly.';
        break;
      case 'educational':
        strategyGuide = 'Provide helpful tips or quick insights. Add value beyond the ask.';
        break;
      case 'seasonal':
        strategyGuide = 'Leverage current season/weather for relevance (freeze protection, summer heat, etc).';
        break;
      default:
        strategyGuide = 'Use best practices for SMS engagement.';
    }

    const prompt = `You are an expert SMS marketing copywriter for Economy Plumbing Services, a professional plumbing company in Austin, TX.

Campaign Goal: ${description}
Strategy: ${strategyGuide}

Generate a professional, engaging SMS message that:
1. Is concise and scannable (ideal: under 160 characters, max: 320 characters)
2. Has a clear call-to-action
3. Uses professional but friendly tone
4. Includes opt-out compliance (e.g., "Reply STOP to unsubscribe")
5. Gets attention immediately
6. Uses conversational language appropriate for SMS
7. Includes company name for branding

CRITICAL SMS RULES:
- NO emojis (carrier filtering issues)
- Keep under 160 characters if possible (1 SMS segment)
- If over 160 chars, stay under 320 chars (2 segments max)
- Include opt-out text: "Reply STOP to opt out"
- Start with attention-grabbing hook
- One clear action/CTA
- Include business name "Economy Plumbing"

Business Context:
- Company: Economy Plumbing Services
- Location: Austin, TX (serving Central Texas)
- Specialties: Residential & commercial plumbing, water heaters, drain cleaning, leak detection
- Brand Voice: Professional, trustworthy, customer-focused, local family business
- Contact: Website: plumbersthatcare.com, Phone: ${fallbackPhone.display}

Example good SMS:
"Economy Plumbing: Schedule your annual water heater checkup this month & save $25. Prevent winter breakdowns! Book: plumbersthatcare.com/schedule Reply STOP to opt out"

Generate:
1. SMS message body (optimized length, includes opt-out)

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "smsBody": "Your SMS message text here..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SMS marketing copywriter. Return ONLY valid JSON, no markdown formatting. Keep SMS messages concise and effective."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    const smsData = JSON.parse(content);

    return NextResponse.json({
      smsBody: smsData.smsBody,
      strategy,
    });

  } catch (error: any) {
    console.error("Error generating AI SMS:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate SMS with AI" },
      { status: 500 }
    );
  }
}
