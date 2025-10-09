import { storage } from "../storage";
import { ObjectStorageService } from "../objectStorage";
import { convertToWebP } from "../lib/webpConverter";
import path from "path";
import fs from "fs";

async function assignUniqueImages() {
  console.log("Assigning unique images to posts...\n");

  const objectStorageService = new ObjectStorageService();
  const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
  const baseStoragePath = publicSearchPaths[0];

  // Map posts to unique images from imported photos
  const assignments = [
    {
      slug: "claras-story",
      sourcePath: "attached_assets/imported_photos/faucet/1759989622798_IMG_4128.jpeg",
      description: "Faucet installation for Clara's story"
    },
    {
      slug: "fall-plumbing-tips",
      sourcePath: "attached_assets/imported_photos/faucet/1759989628254_IMG_4127.jpeg",
      description: "Fall plumbing maintenance"
    }
  ];

  for (const assignment of assignments) {
    try {
      console.log(`🔄 Processing ${assignment.slug}...`);

      const sourcePath = path.join(process.cwd(), assignment.sourcePath);
      
      if (!fs.existsSync(sourcePath)) {
        console.log(`   ⚠️  Source image not found: ${sourcePath}`);
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(sourcePath);
      const baseName = path.basename(sourcePath, ext);
      const tempWebPPath = path.join(process.cwd(), 'attached_assets', 'temp', `${timestamp}_${baseName}.webp`);

      // Convert to WebP
      const conversionResult = await convertToWebP(sourcePath, tempWebPPath, 85);
      
      if (!conversionResult.success) {
        console.log(`   ❌ Conversion failed: ${conversionResult.error}`);
        continue;
      }

      console.log(`   ✓ Converted to WebP`);

      // Upload to Object Storage
      const storagePath = `${baseStoragePath}/blog_images/${timestamp}_${baseName}.webp`;
      await objectStorageService.uploadFile(tempWebPPath, storagePath, "image/webp");
      console.log(`   ✓ Uploaded to Object Storage`);

      // Create public URL
      const publicUrl = `/public-objects/blog_images/${timestamp}_${baseName}.webp`;

      // Update blog post
      const post = await storage.getBlogPostBySlug(assignment.slug);
      if (post) {
        await storage.updateBlogPost(post.id, { featuredImage: publicUrl });
        console.log(`   ✓ Updated ${assignment.slug} with unique image`);
      }

      // Delete temporary WebP file
      fs.unlinkSync(tempWebPPath);
      console.log(`   ✓ Cleaned up temp file\n`);

    } catch (error) {
      console.error(`❌ Error processing ${assignment.slug}:`, error);
    }
  }

  console.log("✅ Unique image assignment complete!");

  // Verify all posts now have unique images
  console.log("\nVerifying image uniqueness...");
  const allPosts = await storage.getBlogPosts();
  const imageCounts = new Map<string, string[]>();
  
  for (const post of allPosts) {
    if (post.featuredImage) {
      const posts = imageCounts.get(post.featuredImage) || [];
      posts.push(post.slug);
      imageCounts.set(post.featuredImage, posts);
    }
  }

  let hasDuplicates = false;
  for (const [imageUrl, posts] of Array.from(imageCounts.entries())) {
    if (posts.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  WARNING: Image ${imageUrl} is used by ${posts.length} posts: ${posts.join(', ')}`);
    }
  }

  if (!hasDuplicates) {
    console.log("✅ All blog posts have unique images!");
  }
}

assignUniqueImages()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });
