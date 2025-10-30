import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { storage } from '@/server/storage';
import { createBeforeAfterComposite } from '@/server/lib/beforeAfterComposer';
import { ObjectStorageService } from '@/server/objectStorage';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const objectStorageService = new ObjectStorageService();
    const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
    const publicPath = publicSearchPaths[0];
    
    // Get all approved success stories (those with collages)
    const stories = await storage.getAllSuccessStories();
    const approvedStories = stories.filter(s => s.approved && s.beforePhotoUrl && s.afterPhotoUrl);
    
    console.log(`[Reprocess Collages] Found ${approvedStories.length} approved success stories to reprocess`);
    
    const results = {
      total: approvedStories.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const story of approvedStories) {
      try {
        console.log(`[Reprocess Collages] Regenerating collage for: ${story.customerName}`);
        
        // Create collage in temp directory
        const tmpDir = os.tmpdir();
        const webpFilename = `success_story_${story.id}_${Date.now()}.webp`;
        const jpegFilename = webpFilename.replace('.webp', '.jpg');
        const tmpWebpPath = path.join(tmpDir, webpFilename);
        const tmpJpegPath = path.join(tmpDir, jpegFilename);
        
        // Create the collage with AI focal point detection (creates both WebP and JPEG)
        await createBeforeAfterComposite(
          story.beforePhotoUrl,
          story.afterPhotoUrl,
          tmpWebpPath
        );
        
        // Upload both WebP and JPEG to object storage
        const webpObjectPath = `${publicPath}/success_stories/${webpFilename}`;
        const jpegObjectPath = `${publicPath}/success_stories/${jpegFilename}`;
        
        await objectStorageService.uploadFile(tmpWebpPath, webpObjectPath, 'image/webp');
        await objectStorageService.uploadFile(tmpJpegPath, jpegObjectPath, 'image/jpeg');
        
        // Clean up temp files
        await fs.unlink(tmpWebpPath).catch(() => {});
        await fs.unlink(tmpJpegPath).catch(() => {});
        
        // Update the success story with new collage URLs
        await storage.updateSuccessStory(story.id, {
          collagePhotoUrl: webpObjectPath,
          jpegCollagePhotoUrl: jpegObjectPath
        });
        
        console.log(`[Reprocess Collages] ✅ Successfully reprocessed: ${story.customerName}`);
        results.successful++;
        
      } catch (error: any) {
        console.error(`[Reprocess Collages] ❌ Failed to reprocess ${story.customerName}:`, error);
        results.failed++;
        results.errors.push(`${story.customerName}: ${error.message}`);
      }
    }
    
    console.log(`[Reprocess Collages] Complete: ${results.successful} successful, ${results.failed} failed`);
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error("[Reprocess Collages] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
