import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PhotoQualityAnalysis {
  isGoodQuality: boolean;
  shouldKeep: boolean;
  qualityScore: number; // 1-10
  reasoning: string;
  categories: string[]; // e.g., ['plumbing', 'water_heater', 'leak']
}

/**
 * Analyzes a job photo using OpenAI Vision to determine if it's useful and good quality.
 * Poor quality photos (blurry, dark, irrelevant) will be marked for deletion.
 */
export async function analyzePhotoQuality(
  imageUrl: string,
  jobDescription?: string
): Promise<PhotoQualityAnalysis> {
  try {
    const systemPrompt = `You are an expert photo quality analyst for a plumbing company. Analyze job site photos and determine if they are:
1. Good quality (clear, well-lit, in focus)
2. Relevant to plumbing work (shows actual plumbing work, fixtures, problems, or completed repairs)
3. Useful for blog posts, marketing, or documentation

REJECT photos that are:
- Blurry, out of focus, or dark
- Accidental screenshots, personal photos, or irrelevant content
- Too close-up to be useful or too far away to see details
- Photos of unrelated subjects (people's faces, random objects, etc.)
- Duplicate or near-duplicate images

KEEP photos that show:
- Clear plumbing work in progress or completed
- Before/after comparisons
- Specific plumbing fixtures (water heaters, pipes, drains, etc.)
- Problems being repaired (leaks, clogs, damage)
- Professional installation work

Respond with JSON in this exact format:
{
  "isGoodQuality": boolean,
  "shouldKeep": boolean,
  "qualityScore": number (1-10),
  "reasoning": "brief explanation of the decision",
  "categories": ["category1", "category2"] // plumbing-related categories like: water_heater, drain, leak, toilet, faucet, pipe, installation, repair, emergency, before, after
}`;

    const userPrompt = jobDescription
      ? `Analyze this job photo. Job context: ${jobDescription}\n\nIs this photo good quality and useful for a plumbing company's blog or marketing?`
      : `Analyze this job photo. Is this photo good quality and useful for a plumbing company's blog or marketing?`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high", // Use high detail for accurate quality assessment
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      isGoodQuality: result.isGoodQuality || false,
      shouldKeep: result.shouldKeep || false,
      qualityScore: Math.max(1, Math.min(10, result.qualityScore || 1)),
      reasoning: result.reasoning || "No analysis available",
      categories: Array.isArray(result.categories) ? result.categories : [],
    };
  } catch (error) {
    console.error("Error analyzing photo quality:", error);
    // On error, default to keeping the photo (fail safe)
    return {
      isGoodQuality: false,
      shouldKeep: true,
      qualityScore: 5,
      reasoning: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      categories: [],
    };
  }
}

/**
 * Batch analyze multiple photos for efficiency
 */
export async function batchAnalyzePhotos(
  photos: Array<{ url: string; jobDescription?: string }>,
  concurrency: number = 3
): Promise<PhotoQualityAnalysis[]> {
  const results: PhotoQualityAnalysis[] = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < photos.length; i += concurrency) {
    const batch = photos.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((photo) => analyzePhotoQuality(photo.url, photo.jobDescription))
    );
    results.push(...batchResults);

    // Small delay between batches to be respectful of rate limits
    if (i + concurrency < photos.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
