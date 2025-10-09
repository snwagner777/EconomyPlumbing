import { storage } from "../storage";
import { ObjectStorageService } from "../objectStorage";
import { convertToWebP } from "../lib/webpConverter";
import fs from "fs";
import path from "path";

/**
 * Migrate all blog images to Object Storage with WebP conversion
 * This script:
 * 1. Finds all blog posts with images
 * 2. Converts images to WebP format
 * 3. Uploads to Object Storage
 * 4. Updates blog post records with new URLs
 * 5. Deletes original images to save space
 */
async function migrateBlogImagesToObjectStorage() {
  console.log("Starting blog image migration to Object Storage...\n");

  const objectStorageService = new ObjectStorageService();
  const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
  
  if (!publicSearchPaths.length) {
    throw new Error("No public search paths configured");
  }

  const baseStoragePath = publicSearchPaths[0]; // Use first public path
  console.log(`Using storage path: ${baseStoragePath}\n`);

  // Get all blog posts
  const posts = await storage.getBlogPosts();
  console.log(`Found ${posts.length} blog posts\n`);

  const results = {
    success: [] as string[],
    skipped: [] as string[],
    failed: [] as Array<{ slug: string; error: string }>
  };

  // Track used images to ensure uniqueness
  const usedImagePaths = new Set<string>();

  for (const post of posts) {
    try {
      if (!post.featuredImage) {
        console.log(`⏭️  Skipping ${post.slug} - no image`);
        results.skipped.push(post.slug);
        continue;
      }

      // Check if already migrated (starts with /public-objects/)
      if (post.featuredImage.startsWith('/public-objects/')) {
        console.log(`⏭️  Skipping ${post.slug} - already migrated`);
        results.skipped.push(post.slug);
        usedImagePaths.add(post.featuredImage);
        continue;
      }

      // Get the local file path (remove leading slash if present)
      const relativePath = post.featuredImage.startsWith('/') 
        ? post.featuredImage.substring(1) 
        : post.featuredImage;
      const localPath = path.join(process.cwd(), relativePath);
      
      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  Warning: Image not found at ${localPath} for post ${post.slug}`);
        results.failed.push({ slug: post.slug, error: "Image file not found" });
        continue;
      }

      console.log(`🔄 Processing ${post.slug}...`);

      // Generate WebP filename
      const originalExt = path.extname(localPath);
      const baseName = path.basename(localPath, originalExt);
      const tempWebPPath = path.join(process.cwd(), 'attached_assets', 'temp', `${baseName}.webp`);

      // Convert to WebP
      const conversionResult = await convertToWebP(localPath, tempWebPPath, 85);
      
      if (!conversionResult.success) {
        console.log(`❌ Failed to convert ${post.slug}: ${conversionResult.error}`);
        results.failed.push({ slug: post.slug, error: conversionResult.error || "Conversion failed" });
        continue;
      }

      console.log(`   ✓ Converted to WebP (${conversionResult.savings}% smaller)`);

      // Upload to Object Storage
      const storagePath = `${baseStoragePath}/blog_images/${baseName}.webp`;
      await objectStorageService.uploadFile(tempWebPPath, storagePath, "image/webp");
      console.log(`   ✓ Uploaded to Object Storage`);

      // Create public URL
      const publicUrl = `/public-objects/blog_images/${baseName}.webp`;

      // Check for duplicate images
      if (usedImagePaths.has(publicUrl)) {
        console.log(`   ⚠️  Warning: Image ${publicUrl} is already used by another post`);
      }
      usedImagePaths.add(publicUrl);

      // Update blog post with new URL
      await storage.updateBlogPost(post.id, { featuredImage: publicUrl });
      console.log(`   ✓ Updated database with new URL`);

      // Delete temporary WebP file
      fs.unlinkSync(tempWebPPath);

      // Delete original image
      fs.unlinkSync(localPath);
      console.log(`   ✓ Deleted original image\n`);

      results.success.push(post.slug);

    } catch (error) {
      console.error(`❌ Error processing ${post.slug}:`, error);
      results.failed.push({ 
        slug: post.slug, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully migrated: ${results.success.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("\nFailed posts:");
    results.failed.forEach(({ slug, error }) => {
      console.log(`  - ${slug}: ${error}`);
    });
  }

  console.log("\n" + "=".repeat(60));

  // Check for duplicate images
  const duplicateImages = new Set<string>();
  const imageCounts = new Map<string, string[]>();
  
  const allPosts = await storage.getBlogPosts();
  for (const post of allPosts) {
    if (post.featuredImage) {
      const posts = imageCounts.get(post.featuredImage) || [];
      posts.push(post.slug);
      imageCounts.set(post.featuredImage, posts);
    }
  }

  for (const [imageUrl, posts] of Array.from(imageCounts.entries())) {
    if (posts.length > 1) {
      duplicateImages.add(imageUrl);
      console.log(`⚠️  WARNING: Image ${imageUrl} is used by ${posts.length} posts: ${posts.join(', ')}`);
    }
  }

  if (duplicateImages.size === 0) {
    console.log("✅ All blog posts have unique images!");
  }

  console.log("\nMigration complete!");
}

// Run the migration
migrateBlogImagesToObjectStorage()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
