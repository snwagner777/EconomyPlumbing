/**
 * Script to standardize blog post categories to match service page categories
 * This fixes the "No inbound links" SEO issue by ensuring all blog posts
 * use categories that are linked from service pages via RelatedBlogPosts component
 */

import { db } from "../db";
import { blogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Map old categories to new standardized categories
const CATEGORY_MAPPING: Record<string, string> = {
  // Keep these (they match service pages)
  "Water Heaters": "Water Heaters",
  "Drain Cleaning": "Drain Cleaning",
  "Leak Repair": "Leak Repair",
  "Maintenance": "Maintenance",
  "Emergency Tips": "Emergency Tips",
  "Gas Services": "Gas Services",
  
  // Standardize these variants
  "Tips": "Emergency Tips",
  "Drains": "Drain Cleaning",
  "Leaks": "Leak Repair",
  "Faucets": "Maintenance",
  "Backflow Testing": "Maintenance",
  "General Plumbing": "Maintenance",
  "Commercial": "Maintenance",
  "Seasonal Tips": "Emergency Tips",
  "Promotions": "Maintenance",
  "Customer Stories": "Maintenance",
};

async function standardizeCategories() {
  console.log("🔄 Fetching all blog posts...");
  
  const allPosts = await db.select().from(blogPosts);
  console.log(`📊 Found ${allPosts.length} total blog posts`);
  
  let updatedCount = 0;
  const categoryChanges: Record<string, number> = {};
  
  for (const post of allPosts) {
    const currentCategory = post.category || "Maintenance";
    const newCategory = CATEGORY_MAPPING[currentCategory] || "Maintenance";
    
    if (currentCategory !== newCategory) {
      console.log(`  📝 "${post.title}"`);
      console.log(`     ${currentCategory} → ${newCategory}`);
      
      await db
        .update(blogPosts)
        .set({ category: newCategory })
        .where(eq(blogPosts.id, post.id));
      
      updatedCount++;
      categoryChanges[`${currentCategory} → ${newCategory}`] = 
        (categoryChanges[`${currentCategory} → ${newCategory}`] || 0) + 1;
    }
  }
  
  console.log("\n✅ Category standardization complete!");
  console.log(`📊 Updated ${updatedCount} blog posts`);
  console.log(`📊 ${allPosts.length - updatedCount} already had correct categories`);
  
  if (Object.keys(categoryChanges).length > 0) {
    console.log("\n📋 Changes made:");
    for (const [change, count] of Object.entries(categoryChanges)) {
      console.log(`   ${change}: ${count} posts`);
    }
  }
  
  // Summary of current category distribution
  console.log("\n📊 Final category distribution:");
  const finalPosts = await db.select().from(blogPosts);
  const categoryCount: Record<string, number> = {};
  for (const post of finalPosts) {
    const cat = post.category || "Maintenance";
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat}: ${count} posts`);
  }
}

standardizeCategories()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
