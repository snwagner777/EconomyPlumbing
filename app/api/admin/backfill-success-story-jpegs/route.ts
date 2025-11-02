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
    
    // Get all success stories without JPEG versions but with WebP collages
    const stories = await storage.getAllSuccessStories();
    const storiesToBackfill = stories.filter(s => s.collagePhotoUrl && !s.jpegCollagePhotoUrl);
    
    console.log(`[JPEG Backfill] Found ${storiesToBackfill.length} success stories to backfill`);
    
    const results = {
      total: storiesToBackfill.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const story of storiesToBackfill) {
      try {
        console.log(`[JPEG Backfill] Processing success story: ${story.customerName}`);
        
        // Skip if no collage URL
        if (!story.collagePhotoUrl) {
          console.log(`[JPEG Backfill] ⏭️ Skipping ${story.customerName} - no collage URL`);
          continue;
        }
        
        // Download the WebP collage
        const webpBuffer = await objectStorageService.downloadBuffer(story.collagePhotoUrl);
        if (!webpBuffer) {
          throw new Error(`Failed to download WebP collage: ${story.collagePhotoUrl}`);
        }
        
        // Convert to JPEG
        const jpegBuffer = await sharp(webpBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
        
        // Upload JPEG version - replace .webp with .jpg in the path
        const jpegPath = story.collagePhotoUrl.replace(/\.webp$/i, '.jpg');
        await objectStorageService.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
        
        // Update database
        await storage.updateSuccessStory(story.id, {
          jpegCollagePhotoUrl: jpegPath
        });
        
        console.log(`[JPEG Backfill] ✅ Successfully backfilled JPEG for: ${story.customerName}`);
        results.successful++;
        
      } catch (error: any) {
        console.error(`[JPEG Backfill] ❌ Failed to backfill ${story.customerName}:`, error);
        results.failed++;
        results.errors.push(`${story.customerName}: ${error.message}`);
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
