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

    const { photoUrl, aiDescription } = await req.json();
    
    if (!photoUrl) {
      return NextResponse.json(
        { error: "Photo URL is required" },
        { status: 400 }
      );
    }

    console.log(`[Manual Blog Post] Generating blog post from photo...`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Create an SEO-optimized plumbing blog post based on this photo${aiDescription ? ` (AI description: ${aiDescription})` : ''}.

Include:
1. An engaging title with plumbing keywords (60-70 characters)
2. A comprehensive article (400-600 words) in markdown format

The blog post should:
- Focus on plumbing services in Austin/Marble Falls, Texas
- Include practical tips and expert advice
- Use natural keyword integration
- Be helpful and informative for homeowners
- Include a call-to-action at the end

Write in a professional yet friendly tone.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: photoUrl } },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse title and content
    const lines = content.split('\n');
    const titleLine = lines.find(line => line.trim().startsWith('#') || line.length > 20 && line.length < 100);
    const title = titleLine?.replace(/^#\s*/, '').trim() || "Expert Plumbing Services in Austin";
    
    // Get content after title
    const titleIndex = lines.indexOf(titleLine || '');
    const blogContent = lines.slice(titleIndex + 1).join('\n').trim();

    console.log(`[Manual Blog Post] ✅ Blog post generated`);

    return NextResponse.json({ title, content: blogContent });
  } catch (error: any) {
    console.error("[Manual Blog Post] Error generating blog post:", error);
    
    // Enhanced error logging for OpenAI API errors
    if (error.response) {
      console.error("[Manual Blog Post] OpenAI API error status:", error.response.status);
      console.error("[Manual Blog Post] OpenAI API error data:", JSON.stringify(error.response.data, null, 2));
    }
    
    // Return detailed error message
    const errorMessage = error.response?.data?.error?.message 
      || error.message 
      || "Unknown error occurred";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
