import { storage } from "../storage";
import { processBlogImage } from "../lib/blogImageProcessor";

async function backfillBlogImages() {
  try {
    console.log("🖼️  Starting blog image backfill process...\n");

    const allPosts = await storage.getBlogPosts();
    
    // Filter posts that don't have cropped images
    const postsNeedingCrops = allPosts.filter(post => 
      post.featuredImage && !post.featuredImage.includes('cropped')
    );

    console.log(`Found ${postsNeedingCrops.length} blog posts needing image processing`);
    console.log(`${allPosts.length - postsNeedingCrops.length} posts already have cropped images\n`);

    if (postsNeedingCrops.length === 0) {
      console.log("✅ All blog posts already have cropped images!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const post of postsNeedingCrops) {
      try {
        console.log(`\n📸 Processing: "${post.title}"`);
        console.log(`   Original: ${post.featuredImage}`);

        // Process the image through AI cropping
        const croppedPath = await processBlogImage(post.featuredImage!, post.title);

        // Update the blog post with the new cropped image
        await storage.updateBlogPost(post.id, {
          featuredImage: croppedPath
        });

        console.log(`   ✅ Updated to: ${croppedPath}`);
        successCount++;
        
        // Add a small delay to avoid overwhelming the OpenAI API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`   ❌ Error processing "${post.title}":`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`\n🎉 Backfill complete!`);
    console.log(`   ✅ Successfully processed: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total posts now with cropped images: ${allPosts.length - postsNeedingCrops.length + successCount}/${allPosts.length}`);
  } catch (error: any) {
    console.error("Fatal error during backfill:", error);
    process.exit(1);
  }
}

// Run the backfill
backfillBlogImages()
  .then(() => {
    console.log("\n✨ Backfill process finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
