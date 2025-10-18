/**
 * Script to generate unique H1 tags for blog posts
 * This fixes the "Identical Title and H1 tags" SEO issue by creating
 * H1 tags that differ from meta titles while maintaining relevance
 */

import { db } from "../db";
import { blogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Generate a unique H1 from a title
function generateH1FromTitle(title: string): string {
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

async function generateAllH1s() {
  console.log("🔄 Fetching all blog posts...");
  
  const posts = await db.select().from(blogPosts);
  console.log(`📝 Found ${posts.length} blog posts`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const post of posts) {
    // Skip if H1 already set
    if (post.h1) {
      skipped++;
      continue;
    }
    
    const newH1 = generateH1FromTitle(post.title);
    
    // Verify H1 is different from title
    if (newH1 === post.title) {
      console.log(`⚠️  Warning: Generated H1 identical to title for "${post.title}"`);
    }
    
    await db.update(blogPosts)
      .set({ h1: newH1 })
      .where(eq(blogPosts.id, post.id));
    
    updated++;
    
    if (updated % 20 === 0) {
      console.log(`✅ Updated ${updated}/${posts.length} posts...`);
    }
  }
  
  console.log(`\n✨ Complete!`);
  console.log(`   Updated: ${updated} posts`);
  console.log(`   Skipped: ${skipped} posts (already had H1)`);
}

// Run the script
generateAllH1s()
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
