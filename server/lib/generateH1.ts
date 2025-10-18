/**
 * Generate a unique H1 tag from a blog post title
 * This fixes the "Identical Title and H1 tags" SEO issue by creating
 * H1 tags that differ from meta titles while maintaining relevance
 */

export function generateH1FromTitle(title: string): string {
  // Strategy: Make H1 more conversational and user-focused
  // while keeping the same keywords, but keep it simple
  
  let h1 = title.trim();
  
  // Simple, consistent approach: Add descriptive prefix based on content type
  if (title.toLowerCase().includes("how to")) {
    // How-to articles: emphasize the action
    h1 = title.replace(/^How to /i, "How to Properly ");
  } else if (title.toLowerCase().includes("guide")) {
    // Guides: add "complete" or "expert"
    if (!title.toLowerCase().includes("complete") && !title.toLowerCase().includes("expert")) {
      h1 = `Complete ${title}`;
    } else {
      h1 = title.replace(/Guide/i, "Expert Guide");
    }
  } else if (title.toLowerCase().includes("cost") || title.toLowerCase().includes("price")) {
    // Cost/pricing articles: add "understanding"
    h1 = `Understanding ${title}`;
  } else if (title.toLowerCase().includes("tips") || title.toLowerCase().includes("advice")) {
    // Tips: add "expert" or "professional"
    h1 = `Expert ${title}`;
  } else if (title.toLowerCase().match(/\b(why|what|when|where|which)\b/)) {
    // Question-based: add "understanding"
    h1 = `Understanding ${title}`;
  } else if (title.toLowerCase().includes("signs of") || title.toLowerCase().includes("symptoms")) {
    // Diagnostic content: add "recognizing"
    h1 = `Recognizing ${title}`;
  } else {
    // Default: add "your guide to"
    h1 = `Your Guide to ${title}`;
  }
  
  // Ensure H1 is different from title
  if (h1 === title) {
    h1 = `Expert Guide: ${h1}`;
  }
  
  return h1;
}
