/**
 * Script to shorten blog post titles that are too long for SEO
 * SEO best practice: Title tags should be 50-60 characters max
 * This script shortens titles >60 characters while preserving keywords
 */

import { db } from "../db";
import { blogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { generateH1FromTitle } from "../lib/generateH1";

// Shorten a title intelligently while preserving keywords
function shortenTitle(title: string): string {
  if (title.length <= 60) return title;
  
  // Strategy: Remove location qualifiers and filler words
  let shortened = title
    // Remove redundant location phrases
    .replace(/ in Austin and Marble Falls/gi, "")
    .replace(/ in Austin & Marble Falls/gi, "")
    .replace(/ in Austin/gi, "")
    .replace(/ in Marble Falls/gi, "")
    .replace(/ in Central Texas/gi, "")
    .replace(/ for Austin Homeowners/gi, "")
    .replace(/ for Austin and Marble Falls Homeowners/gi, "")
    .replace(/ for Homeowners/gi, "")
    
    // Remove redundant qualifiers
    .replace(/: Expert Tips for /gi, ": ")
    .replace(/: Essential Tips for /gi, ": ")
    .replace(/: What .* Need to Know/gi, "")
    .replace(/ - What You Should Know/gi, "")
    
    // Trim
    .trim();
  
  // If still too long, be more aggressive
  if (shortened.length > 60) {
    // Remove colons and convert to simpler format
    shortened = shortened
      .replace(/: /g, " - ")
      .replace(/ Expert Tips/gi, "")
      .replace(/ Essential Tips/gi, "")
      .replace(/ Professional /gi, " ")
      .trim();
  }
  
  // Final fallback: truncate at word boundary
  if (shortened.length > 60) {
    shortened = shortened.substring(0, 57).trim() + "...";
    // Remove trailing punctuation before ellipsis
    shortened = shortened.replace(/[,:]\.\.\.$/,  "...");
  }
  
  return shortened;
}

async function shortenLongTitles() {
  console.log("🔄 Fetching blog posts with long titles...");
  
  const allPosts = await db.select().from(blogPosts);
  const longTitles = allPosts.filter(p => p.title.length > 60);
  
  console.log(`📊 Found ${longTitles.length} posts with titles >60 characters`);
  console.log(`📊 ${allPosts.length - longTitles.length} posts already have acceptable titles\n`);
  
  let updatedCount = 0;
  
  for (const post of longTitles) {
    const originalTitle = post.title;
    const newTitle = shortenTitle(originalTitle);
    const newH1 = generateH1FromTitle(newTitle);
    
    if (newTitle !== originalTitle) {
      console.log(`📝 "${originalTitle}"`);
      console.log(`   (${originalTitle.length} chars)`);
      console.log(`   ↓`);
      console.log(`   "${newTitle}"`);
      console.log(`   (${newTitle.length} chars)`);
      console.log(`   H1: "${newH1}"\n`);
      
      await db
        .update(blogPosts)
        .set({ 
          title: newTitle,
          h1: newH1 
        })
        .where(eq(blogPosts.id, post.id));
      
      updatedCount++;
    }
  }
  
  console.log(`\n✅ Title shortening complete!`);
  console.log(`📊 Updated ${updatedCount} blog posts`);
  
  // Check for any remaining long titles
  const finalPosts = await db.select().from(blogPosts);
  const stillLong = finalPosts.filter(p => p.title.length > 60);
  
  if (stillLong.length > 0) {
    console.log(`\n⚠️  Warning: ${stillLong.length} posts still have titles >60 characters:`);
    for (const post of stillLong.slice(0, 5)) {
      console.log(`   - "${post.title}" (${post.title.length} chars)`);
    }
  } else {
    console.log(`\n✅ All blog post titles are now ≤60 characters!`);
  }
}

shortenLongTitles()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
