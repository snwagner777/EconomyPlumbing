import OpenAI from "openai";
import type { CompanyCamPhoto } from "@shared/schema";
import { mapCategoryToDisplay } from "./categoryMapper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BlogTopicSuggestion {
  topic: string;
  title: string;
  reasoning: string;
  seoKeywords: string[];
  categoryFocus: 'water_heater' | 'drain' | 'leak' | 'toilet' | 'faucet' | 'gas' | 'backflow' | 'commercial' | 'general';
}

export async function suggestBlogTopic(photo: CompanyCamPhoto): Promise<BlogTopicSuggestion> {
  const prompt = `You are a plumbing content strategist for Economy Plumbing Services in Austin and Marble Falls, Texas.

Analyze this plumbing photo and suggest the BEST blog post topic for it.

PHOTO DETAILS:
- Category: ${photo.category}
- AI Description: ${photo.aiDescription}
- Quality Score: ${photo.qualityScore}/10
- Tags: ${photo.tags?.join(', ')}

CONTENT STRATEGY:
1. HEAVY focus on water heater content (40% of suggestions), but don't sacrifice other services
2. Create natural, helpful content that doesn't sound AI-written
3. Focus on Austin/Marble Falls-specific issues (hard water, heat, seasonal problems)
4. Target homeowner questions and pain points
5. Make titles engaging and SEO-friendly

OUTPUT FORMAT (JSON):
{
  "topic": "Brief topic description (e.g., 'Signs you need a new water heater')",
  "title": "Engaging blog post title",
  "reasoning": "Why this topic fits this photo and our strategy",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "categoryFocus": "water_heater" or "drain" or "leak" or "toilet" or "faucet" or "gas" or "backflow" or "commercial" or "general"
}

EXAMPLES OF GOOD TOPICS:
- "5 Warning Signs Your Water Heater Needs Replacement in Austin"
- "Why Your Drains Smell in Texas Summer Heat"
- "How Hard Water Damages Austin Home Plumbing"
- "Emergency Plumbing: What to Do When Your Water Heater Fails"

Suggest ONE blog topic for this photo:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert plumbing content strategist. Return ONLY valid JSON, no additional text."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.8,
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const suggestion: BlogTopicSuggestion = JSON.parse(content);
  
  console.log(`[Blog Topic Analyzer] Suggested topic for ${photo.id}:`, suggestion.title);
  
  return suggestion;
}

export async function generateBlogPost(
  photo: CompanyCamPhoto,
  topicSuggestion: BlogTopicSuggestion
): Promise<{
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  category: string;
}> {
  const prompt = `You are a professional plumbing content writer for Economy Plumbing Services.

Write a blog post about: ${topicSuggestion.title}

CONTEXT:
- Photo Category: ${photo.category}
- Photo Description: ${photo.aiDescription}
- SEO Keywords: ${topicSuggestion.seoKeywords.join(', ')}

WRITING GUIDELINES:
1. Write in a natural, conversational tone - NOT AI-sounding
2. Use specific examples and practical advice
3. Include Austin/Marble Falls local context (hard water, heat, seasonal issues)
4. 800-1200 words minimum - comprehensive, long-form content
5. Include a clear CTA at the end with phone number (512) 368-9159
6. Use proper markdown formatting with correct heading hierarchy
7. Be helpful and informative, not salesy
8. Focus on homeowner pain points and solutions

CRITICAL SEO & PAGESPEED STRUCTURE:
- NO H1 tags in content (title is H1) - Start with H2 for main sections
- Use H2 (##) for main sections (4-6 sections minimum)
- Use H3 (###) for subsections under H2s
- Use H4 (####) sparingly for deeper subsections
- Include descriptive alt text for any images: ![Alt text description](url)
- Use bullet points (- or *) and numbered lists (1. 2. 3.) for scannability
- Start with a relatable intro paragraph (no heading)
- End with "Need Help?" or "Contact Us" H2 section with clear CTA

HEADING HIERARCHY EXAMPLE:
Introduction paragraph...

## Common Signs Your Water Heater Needs Repair
Content here...

### Unusual Noises
Details...

### Rusty Water
Details...

## When to Call a Professional
Content here...

## Austin-Specific Considerations
Local context...

## Need Help with Your Water Heater?
Call (512) 368-9159 today!

OUTPUT FORMAT (JSON):
{
  "title": "Exact blog post title",
  "slug": "url-friendly-slug",
  "content": "Full markdown blog post content",
  "excerpt": "Compelling 2-3 sentence summary",
  "metaDescription": "SEO meta description (150-160 chars)",
  "category": "Blog category matching photo category"
}

Write the complete blog post:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert plumbing content writer. Write natural, helpful content that doesn't sound AI-generated. Return ONLY valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.9,
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const blogPost = JSON.parse(content);
  
  // Convert machine category to display category
  if (blogPost.category) {
    blogPost.category = mapCategoryToDisplay(blogPost.category);
  }
  
  console.log(`[Blog Generator] Generated post: ${blogPost.title} (Category: ${blogPost.category})`);
  
  return blogPost;
}
