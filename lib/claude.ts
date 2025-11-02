/**
 * Claude AI Integration (Replit AI Integrations)
 * 
 * This uses Replit's AI Integrations service - no API key needed,
 * charges are billed to your Replit credits.
 * 
 * Supported models:
 * - claude-opus-4-1: Most capable, best for complex reasoning
 * - claude-sonnet-4-5: Balanced (recommended)
 * - claude-haiku-4-5: Fastest and most compact
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!,
});

/**
 * Simple text generation with Claude
 */
export async function generateText(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Unexpected response type");
}

/**
 * Generate text with system instructions
 */
export async function generateWithSystem(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Unexpected response type");
}

/**
 * Analyze an image with Claude (base64 encoded)
 */
export async function analyzeImage(
  base64Image: string,
  prompt: string = "Analyze this image in detail"
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Unexpected response type");
}

/**
 * Use Claude with web search capability
 */
export async function searchAndAnswer(query: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [
      {
        role: "user",
        content: query,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  if (textContent && textContent.type === "text") {
    return textContent.text;
  }

  throw new Error("No text response received");
}
