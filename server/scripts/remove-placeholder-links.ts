/**
 * Script to remove placeholder and broken external links from blog post content
 * This fixes the "External links to 3XX" and "External links missing anchor" SEO issues
 * caused by AI-generated placeholder URLs
 */

import { db } from "../db";
import { blogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Patterns to remove (placeholder URLs from AI generation)
const PLACEHOLDER_PATTERNS = [
  /https?:\/\/example\.com[^\s\)"]*/gi,
  /https?:\/\/url-to-image\.com[^\s\)"]*/gi,
  /https?:\/\/drive\.google\.com\/uc\?id=samplephotoid[^\s\)"]*/gi,
  /https?:\/\/drive\.google\.com\/file\/d\/your-photo-url[^\s\)"]*/gi,
  /https?:\/\/drive\.google\.com\/drive\/[^\s\)"]*/gi,
  /\[!\[.*?\]\(https?:\/\/example\.com[^\)]*\)\]/gi,
  /\[!\[.*?\]\(https?:\/\/url-to-image\.com[^\)]*\)\]/gi,
  /\[!\[.*?\]\(https?:\/\/drive\.google\.com[^\)]*\)\]/gi,
];

async function removePlaceholderLinks() {
  console.log("🔄 Fetching blog posts with external links...");
  
  const allPosts = await db.select().from(blogPosts);
  const postsWithLinks = allPosts.filter(p => 
    p.content && (
      p.content.includes('http://example.com') ||
      p.content.includes('https://example.com') ||
      p.content.includes('url-to-image.com') ||
      p.content.includes('samplephotoid') ||
      p.content.includes('your-photo-url')
    )
  );
  
  console.log(`📊 Found ${postsWithLinks.length} posts with placeholder links\n`);
  
  let updatedCount = 0;
  
  for (const post of postsWithLinks) {
    let updatedContent = post.content || '';
    const originalContent = updatedContent;
    
    // Remove all placeholder link patterns
    for (const pattern of PLACEHOLDER_PATTERNS) {
      updatedContent = updatedContent.replace(pattern, '');
    }
    
    // Clean up empty markdown image syntax: ![](  )
    updatedContent = updatedContent.replace(/!\[\]\(\s*\)/g, '');
    
    // Clean up duplicate spaces and line breaks
    updatedContent = updatedContent.replace(/  +/g, ' ');
    updatedContent = updatedContent.replace(/\n\n\n+/g, '\n\n');
    
    if (updatedContent !== originalContent) {
      console.log(`📝 Cleaning: "${post.title}"`);
      console.log(`   Removed placeholder links\n`);
      
      await db
        .update(blogPosts)
        .set({ content: updatedContent })
        .where(eq(blogPosts.id, post.id));
      
      updatedCount++;
    }
  }
  
  console.log(`\n✅ Placeholder link removal complete!`);
  console.log(`📊 Updated ${updatedCount} blog posts`);
  console.log(`📊 ${postsWithLinks.length - updatedCount} had no changes needed`);
  
  // Verify no placeholder links remain
  const finalPosts = await db.select().from(blogPosts);
  const remainingLinks = finalPosts.filter(p => 
    p.content && (
      p.content.includes('example.com') ||
      p.content.includes('url-to-image.com') ||
      p.content.includes('samplephotoid')
    )
  );
  
  if (remainingLinks.length > 0) {
    console.log(`\n⚠️  Warning: ${remainingLinks.length} posts still have placeholder links`);
  } else {
    console.log(`\n✅ All placeholder links successfully removed!`);
  }
}

removePlaceholderLinks()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
