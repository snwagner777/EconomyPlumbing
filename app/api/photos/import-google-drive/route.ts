import { NextRequest, NextResponse } from 'next/server';
import { getImagesFromFolder, downloadFileAsBuffer } from '@/server/lib/googleDriveClient';
import { analyzePhotoQuality } from '@/server/lib/photoQualityAnalyzer';
import { companyCamPhotos } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const { folderId } = await req.json();

    if (!folderId) {
      return NextResponse.json({ 
        message: "Google Drive folder ID is required" 
      }, { status: 400 });
    }

    console.log(`[Google Drive Import] Starting import from folder: ${folderId}`);

    // Get all images from the folder
    const files = await getImagesFromFolder(folderId);
    console.log(`[Google Drive Import] Found ${files.length} images in folder`);

    const savedPhotos = [];
    const rejectedPhotos = [];
    const photosByCategory: Record<string, any[]> = {};

    // Process each image (simplified - full implementation in server/routes.ts line 4103+)
    for (const file of files) {
      try {
        console.log(`[Google Drive Import] Processing: ${file.name}`);

        // Check if photo already exists in database (skip duplicates)
        const photoId = file.id || Buffer.from(file.name || '').toString('base64').substring(0, 32);
        const existingPhoto = await db.select().from(companyCamPhotos)
          .where(eq(companyCamPhotos.companyCamPhotoId, photoId))
          .limit(1);
        
        if (existingPhoto.length > 0) {
          console.log(`[Google Drive Import] ⏭️  Skipping ${file.name} (already in database)`);
          continue;
        }

        // Additional processing would go here - see full implementation in server/routes.ts
      } catch (error: any) {
        console.error(`[Google Drive Import] Error processing ${file.name}:`, error);
        rejectedPhotos.push({ file: file.name, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      imported: savedPhotos.length,
      rejected: rejectedPhotos.length,
      savedPhotos,
      rejectedPhotos,
      photosByCategory
    });
  } catch (error: any) {
    console.error("Error importing from Google Drive:", error);
    return NextResponse.json({
      message: "Failed to import photos from Google Drive",
      error: error.message
    }, { status: 500 });
  }
}
