import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { storage } from '@/server/storage';
import { analyzePhotoQuality } from '@/server/lib/photoQualityAnalyzer';
import { db } from '@/server/db';
import { companyCamPhotos } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    console.log("[Admin] Starting photo reprocessing with improved AI analysis...");
    
    const photos = await storage.getAllPhotos();
    console.log(`[Admin] Found ${photos.length} photos to reprocess`);
    
    let reprocessed = 0;
    let errors = 0;
    
    for (const photo of photos) {
      try {
        const analysis = await analyzePhotoQuality(photo.photoUrl, photo.aiDescription || '');
        
        // Update photo with analysis results (simplified for compatibility)
        await db.update(companyCamPhotos)
          .set({
            aiDescription: analysis.aiDescription,
            category: analysis.aiCategory,
            qualityScore: analysis.qualityScore || 0,
          })
          .where(eq(companyCamPhotos.id, photo.id));
        
        reprocessed++;
        
        if (reprocessed % 10 === 0) {
          console.log(`[Admin] Reprocessed ${reprocessed}/${photos.length} photos...`);
        }
        
      } catch (error: any) {
        console.error(`[Admin] Error reprocessing photo ${photo.id}:`, error);
        errors++;
      }
    }
    
    console.log(`[Admin] Reprocessing complete: ${reprocessed} photos updated, ${errors} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Reprocessed ${reprocessed} photos with improved AI analysis`,
      reprocessed,
      errors,
      total: photos.length
    });
    
  } catch (error: any) {
    console.error("[Admin] Error reprocessing photos:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
