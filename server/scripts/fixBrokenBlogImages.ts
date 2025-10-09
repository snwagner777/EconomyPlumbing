import { DatabaseStorage } from "../storage";
import { processBlogImage } from "../lib/blogImageProcessor";

async function fixBrokenBlogImages() {
  console.log("🔧 [Fix Broken Images] Starting repair process...");
  
  const storage = new DatabaseStorage();
  
  // Fix the toilet post that has a missing image
  const toiletPostId = "b3dd7554-e9a3-4cc1-b9cd-4916de6e7b68";
  const replacementPhotoPath = "/attached_assets/imported_photos/toilet/1760018197619_IMG_3830.webp";
  const replacementPhotoId = "ceefc879-0ec4-4d40-a5aa-c18436c2ac3b";
  
  try {
    // Get the post by slug
    const post = await storage.getBlogPostBySlug("common-toilet-installation-mistakes-austin-homes");
    if (!post) {
      console.error("❌ Post not found");
      return;
    }
    
    console.log(`📝 Fixing post: "${post.title}"`);
    console.log(`📸 Using replacement image: ${replacementPhotoPath}`);
    
    // Process the image with focal points
    const imageData = await processBlogImage(replacementPhotoPath, post.title);
    
    console.log(`✅ Processed image: ${imageData.imagePath}`);
    console.log(`📍 Focal point: (${imageData.focalPointX}, ${imageData.focalPointY})`);
    
    // Update the blog post
    await storage.updateBlogPost(toiletPostId, {
      featuredImage: imageData.imagePath,
      focalPointX: imageData.focalPointX,
      focalPointY: imageData.focalPointY,
      imageId: replacementPhotoId
    });
    
    // Mark the new photo as used
    await storage.markPhotoAsUsed(replacementPhotoId, toiletPostId);
    
    console.log("✅ [Fix Broken Images] Successfully fixed toilet post!");
    
  } catch (error: any) {
    console.error("❌ [Fix Broken Images] Error:", error.message);
  }
  
  process.exit(0);
}

fixBrokenBlogImages();
