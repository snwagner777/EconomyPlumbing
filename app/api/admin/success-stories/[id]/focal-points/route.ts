import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
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
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { beforeFocalX, beforeFocalY, afterFocalX, afterFocalY } = await req.json();

    console.log(`[Success Stories] Updating focal points for story ${id}...`, { beforeFocalX, beforeFocalY, afterFocalX, afterFocalY });

    // Get the story first
    const stories = await storage.getAllSuccessStories();
    const storyData = stories.find(s => s.id === id);
    
    if (!storyData) {
      return NextResponse.json(
        { error: "Success story not found" },
        { status: 404 }
      );
    }

    // Validate and round focal points to integers
    const roundFocal = (val: any) => val !== undefined && val !== null ? Math.round(Number(val)) : null;

    // Save focal points to database (rounded to integers)
    const updatedStory = await storage.updateSuccessStory(id, {
      beforeFocalX: roundFocal(beforeFocalX),
      beforeFocalY: roundFocal(beforeFocalY),
      afterFocalX: roundFocal(afterFocalX),
      afterFocalY: roundFocal(afterFocalY),
    });

    // Regenerate collage with new focal points if story is approved
    if (storyData.approved && storyData.beforePhotoUrl && storyData.afterPhotoUrl) {
      console.log(`[Success Stories] Regenerating collage with new focal points...`);
      
      const objectStorageService = new ObjectStorageService();
      const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
      const publicPath = publicSearchPaths[0];
      
      // Create collage in temp directory
      const tmpDir = os.tmpdir();
      const webpFilename = `success_story_${id}_${Date.now()}.webp`;
      const jpegFilename = webpFilename.replace('.webp', '.jpg');
      const tmpWebpPath = path.join(tmpDir, webpFilename);
      const tmpJpegPath = path.join(tmpDir, jpegFilename);
      
      // Create manual focal points object (only if set)
      const manualFocalPoints: any = {};
      if (beforeFocalX !== undefined && beforeFocalY !== undefined) {
        manualFocalPoints.before = { x: beforeFocalX, y: beforeFocalY };
      }
      if (afterFocalX !== undefined && afterFocalY !== undefined) {
        manualFocalPoints.after = { x: afterFocalX, y: afterFocalY };
      }
      
      // Create the collage with manual focal points
      await createBeforeAfterComposite(
        storyData.beforePhotoUrl,
        storyData.afterPhotoUrl,
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
      
      console.log(`[Success Stories] ✅ Collage regenerated with custom focal points`);
    }

    return NextResponse.json({ story: updatedStory });
  } catch (error: any) {
    console.error("[Success Stories] Error updating focal points:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
