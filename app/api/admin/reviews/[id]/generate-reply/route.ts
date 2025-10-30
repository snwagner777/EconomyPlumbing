import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { db } from '@/server/db';
import { googleReviews } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import OpenAI from 'openai';

const requestSchema = z.object({
  type: z.enum(['google', 'custom']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { type } = requestSchema.parse(body);
    
    // Fetch the review
    let review: any;
    if (type === 'custom') {
      const reviews = await storage.getAllReviews();
      review = reviews.find((r: any) => r.id === id);
      if (!review) {
        return NextResponse.json(
          { message: "Review not found" },
          { status: 404 }
        );
      }
    } else {
      const result = await db
        .select()
        .from(googleReviews)
        .where(eq(googleReviews.id, id))
        .execute();
      
      if (!result || result.length === 0) {
        return NextResponse.json(
          { message: "Review not found" },
          { status: 404 }
        );
      }
      review = result[0];
    }
    
    // Generate AI reply using OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `You are responding to a customer review for Economy Plumbing Services, a professional plumbing company in Austin, Texas.

Review Details:
- Customer: ${type === 'custom' ? review.customerName : review.authorName}
- Rating: ${review.rating}/5 stars
- Review: "${review.text}"

Generate a professional, friendly, and personalized response that:
1. Thanks the customer by name
2. Acknowledges their specific feedback
3. For 5-star reviews: Express gratitude and mention looking forward to serving them again
4. For 4-star reviews: Thank them and subtly invite feedback on how to improve
5. For 3-star or lower: Apologize for any issues, show empathy, and offer to make it right
6. Keep it concise (2-3 sentences max)
7. Sign off as "The Economy Plumbing Team"

Generate ONLY the reply text, no explanations or meta-commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const aiReply = completion.choices[0]?.message?.content?.trim();
    
    if (!aiReply) {
      return NextResponse.json(
        { message: "Failed to generate AI reply" },
        { status: 500 }
      );
    }
    
    console.log(`[Review Reply] Generated AI reply for review ${id}`);
    return NextResponse.json({ reply: aiReply });
  } catch (error: any) {
    console.error('[Review Reply] AI generation error:', error);
    return NextResponse.json(
      { message: "Error generating AI reply: " + error.message },
      { status: 500 }
    );
  }
}
