import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { storage } from '@/server/storage';
import { ObjectStorageService } from '@/server/objectStorage';
import { createBeforeAfterComposite } from '@/server/lib/beforeAfterComposer';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    console.log(`[Success Stories] Swapping before/after photos for story ${id}...`);

    // Get the story first
    const stories = await storage.getAllSuccessStories();
    const storyData = stories.find(s => s.id === id);
    
    if (!storyData) {
      return NextResponse.json(
        { error: "Success story not found" },
        { status: 404 }
      );
    }

    // Swap the photo URLs and focal points
    const updatedStory = await storage.updateSuccessStory(id, {
      beforePhotoUrl: storyData.afterPhotoUrl,
      afterPhotoUrl: storyData.beforePhotoUrl,
      beforeFocalX: storyData.afterFocalX,
      beforeFocalY: storyData.afterFocalY,
      afterFocalX: storyData.beforeFocalX,
      afterFocalY: storyData.beforeFocalY,
    });

    // Regenerate collage with swapped photos if story is approved
    if (storyData.approved && storyData.beforePhotoUrl && storyData.afterPhotoUrl) {
      console.log(`[Success Stories] Regenerating collage with swapped photos...`);
      
      const objectStorageService = new ObjectStorageService();
      const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
      const publicPath = publicSearchPaths[0];
      
      // Create collage in temp directory
      const tmpDir = os.tmpdir();
      const webpFilename = `success_story_${id}_${Date.now()}.webp`;
      const jpegFilename = webpFilename.replace('.webp', '.jpg');
      const tmpWebpPath = path.join(tmpDir, webpFilename);
      const tmpJpegPath = path.join(tmpDir, jpegFilename);
      
      // Create manual focal points object if they exist (already swapped in updatedStory)
      const manualFocalPoints: any = {};
      if (updatedStory.beforeFocalX !== null && updatedStory.beforeFocalY !== null) {
        manualFocalPoints.before = { x: updatedStory.beforeFocalX, y: updatedStory.beforeFocalY };
      }
      if (updatedStory.afterFocalX !== null && updatedStory.afterFocalY !== null) {
        manualFocalPoints.after = { x: updatedStory.afterFocalX, y: updatedStory.afterFocalY };
      }
      
      // Create the collage with swapped photos
      await createBeforeAfterComposite(
        updatedStory.beforePhotoUrl,
        updatedStory.afterPhotoUrl,
        tmpWebpPath,
        Object.keys(manualFocalPoints).length > 0 ? manualFocalPoints : undefined
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
      await storage.updateSuccessStory(id, {
        collagePhotoUrl: webpObjectPath,
        jpegCollagePhotoUrl: jpegObjectPath
      });
      
      console.log(`[Success Stories] ✅ Collage regenerated with swapped photos`);
    }

    return NextResponse.json({ story: updatedStory });
  } catch (error: any) {
    console.error("[Success Stories] Error swapping photos:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
