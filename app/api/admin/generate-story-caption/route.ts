import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { photo1Url, photo2Url } = await req.json();
    
    if (!photo1Url || !photo2Url) {
      return NextResponse.json(
        { error: "Both photo URLs are required" },
        { status: 400 }
      );
    }

    console.log(`[Manual Success Story] Generating caption for photos...`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these two plumbing job photos (before and after). Create a compelling success story with:
1. A short, impactful title (5-8 words)
2. A brief description (2-3 sentences) explaining the transformation

Focus on the problem solved, the quality of work, and customer satisfaction. Use professional plumbing terminology.`,
            },
            {
              type: "image_url",
              image_url: { url: photo1Url },
            },
            {
              type: "image_url",
              image_url: { url: photo2Url },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse the response to extract title and description
    const lines = content.split('\n').filter((line: string) => line.trim());
    const title = lines[0]?.replace(/^(Title:|1\.|#)\s*/i, '').trim() || "Professional Plumbing Service";
    const description = lines.slice(1).join(' ').replace(/^(Description:|2\.)\s*/i, '').trim() || content;

    console.log(`[Manual Success Story] ✅ Caption generated`);

    return NextResponse.json({ title, description });
  } catch (error: any) {
    console.error("[Manual Success Story] Error generating caption:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
