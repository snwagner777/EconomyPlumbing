/**
 * Script to generate unique H1 tags for blog posts
 * This fixes the "Identical Title and H1 tags" SEO issue by creating
 * H1 tags that differ from meta titles while maintaining relevance
 */

import { db } from "../db";
import { blogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { generateH1FromTitle } from "../lib/generateH1";

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
