import { storage } from "../storage";
import { processBlogImage } from "../lib/blogImageProcessor";

async function processAllBlogImages() {
  try {
    console.log("🚀 Starting blog image processing...\n");

    // Get all blog posts
    const posts = await storage.getBlogPosts();
    console.log(`📚 Found ${posts.length} blog posts\n`);

    const results: { id: string; title: string; original: string; cropped: string }[] = [];
    const errors: { id: string; title: string; error: string }[] = [];

    for (const post of posts) {
      if (!post.featuredImage) {
        console.log(`⏭️  Skipping post "${post.title}" - no featured image\n`);
        continue;
      }

      try {
        console.log(`📸 Processing: "${post.title}"`);
        console.log(`   Original: ${post.featuredImage}`);

        const croppedPath = await processBlogImage(post.featuredImage, post.title);

        console.log(`   Cropped: ${croppedPath}`);
        console.log(`✅ Success!\n`);

        results.push({
          id: post.id,
          title: post.title,
          original: post.featuredImage,
          cropped: croppedPath,
        });

        // Update the blog post with the cropped image
        await storage.updateBlogPost(post.id, {
          featuredImage: croppedPath,
        });

        console.log(`💾 Updated blog post #${post.id} with cropped image\n`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error processing "${post.title}": ${errorMsg}\n`);
        errors.push({
          id: post.id,
          title: post.title,
          error: errorMsg,
        });
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 PROCESSING SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successful: ${results.length}`);
    console.log(`❌ Failed: ${errors.length}`);
    console.log(`⏭️  Skipped: ${posts.filter(p => !p.featuredImage).length}`);

    if (results.length > 0) {
      console.log("\n✅ Successfully processed:");
      results.forEach(r => {
        console.log(`   - ${r.title}`);
        console.log(`     ${r.original} → ${r.cropped}`);
      });
    }

    if (errors.length > 0) {
      console.log("\n❌ Failed to process:");
      errors.forEach(e => {
        console.log(`   - ${e.title}: ${e.error}`);
      });
    }

    console.log("\n✨ Done!\n");
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
processAllBlogImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
