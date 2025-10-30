import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { ObjectStorageService } from '@/server/objectStorage';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const objectStorageService = new ObjectStorageService();
    
    // Get all blog posts without JPEG versions but with WebP featured images
    const posts = await storage.getBlogPosts();
    const postsToBackfill = posts.filter((p: any) => p.featuredImage && !p.jpegFeaturedImage);
    
    console.log(`[JPEG Backfill] Found ${postsToBackfill.length} blog posts to backfill`);
    
    const results = {
      total: postsToBackfill.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const post of postsToBackfill) {
      try {
        console.log(`[JPEG Backfill] Processing blog post: ${post.title}`);
        
        // Skip if no featured image
        if (!post.featuredImage) {
          console.log(`[JPEG Backfill] ⏭️ Skipping ${post.title} - no featured image`);
          continue;
        }
        
        // Download the WebP image
        const webpBuffer = await objectStorageService.downloadBuffer(post.featuredImage);
        if (!webpBuffer) {
          throw new Error(`Failed to download WebP image: ${post.featuredImage}`);
        }
        
        // Convert to JPEG
        const jpegBuffer = await sharp(webpBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        
        // Upload JPEG version - replace .webp with .jpg in the path
        const jpegPath = post.featuredImage.replace(/\.webp$/i, '.jpg');
        await objectStorageService.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
        
        // Update database
        await storage.updateBlogPost(post.id.toString(), {
          jpegFeaturedImage: jpegPath
        });
        
        console.log(`[JPEG Backfill] ✅ Successfully backfilled JPEG for: ${post.title}`);
        results.successful++;
        
      } catch (error: any) {
        console.error(`[JPEG Backfill] ❌ Failed to backfill ${post.title}:`, error);
        results.failed++;
        results.errors.push(`${post.title}: ${error.message}`);
      }
    }
    
    console.log(`[JPEG Backfill] Complete: ${results.successful} successful, ${results.failed} failed`);
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error("[JPEG Backfill] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
