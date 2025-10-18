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
  // while keeping the same keywords
  
  // Remove common suffixes and modifiers
  let h1 = title
    .replace(/\s*-\s*Complete Guide$/i, "")
    .replace(/\s*-\s*Expert Guide$/i, "")
    .replace(/\s*-\s*.*Guide$/i, "")
    .replace(/\s*\|\s*Economy Plumbing$/i, "")
    .replace(/\s*\|\s*.*$/i, "")
    .trim();
  
  // Add conversational elements based on content type
  if (title.toLowerCase().includes("guide") || title.toLowerCase().includes("how to")) {
    // For guides, make them more conversational
    if (!h1.startsWith("How") && !h1.startsWith("Your")) {
      h1 = `Your Complete Guide to ${h1}`;
    } else if (h1.startsWith("How to ")) {
      h1 = h1.replace(/^How to /, "How to Successfully ");
    }
  } else if (title.toLowerCase().includes("cost") || title.toLowerCase().includes("price")) {
    // For cost/pricing articles
    if (!h1.toLowerCase().includes("what")) {
      h1 = `Understanding ${h1}`;
    }
  } else if (title.toLowerCase().includes("austin") || title.toLowerCase().includes("marble falls")) {
    // For location-specific content
    const location = title.match(/(Austin|Marble Falls)/i)?.[0] || "";
    if (location && !h1.toLowerCase().startsWith("professional")) {
      h1 = h1.replace(new RegExp(`${location}\\s*`, "i"), "");
      h1 = `Professional ${h1} in ${location}`;
    }
  } else if (title.toLowerCase().includes("tips") || title.toLowerCase().includes("advice")) {
    // For tips and advice
    if (!h1.toLowerCase().includes("expert") && !h1.toLowerCase().includes("professional")) {
      h1 = `Expert ${h1}`;
    }
  } else {
    // Default: add "Everything You Need to Know About"
    if (!h1.toLowerCase().includes("expert") && !h1.toLowerCase().includes("complete")) {
      h1 = `Everything You Need to Know About ${h1}`;
    }
  }
  
  // Ensure H1 is different from title
  if (h1 === title) {
    h1 = `Professional Guide: ${h1}`;
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
