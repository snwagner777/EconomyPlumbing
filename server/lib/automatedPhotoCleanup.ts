import { db } from '../db';
import { companyCamPhotos } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { findSimilarPhotos } from './similarPhotoDetector';
import { ObjectStorageService } from '../objectStorage';
import path from 'path';

// Run cleanup daily
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

let isRunning = false;

/**
 * Execute the similar photo cleanup process
 * Returns stats about groups found and photos deleted
 */
export async function executePhotoCleanup() {
  const objectStorageService = new ObjectStorageService();
  
  // Get ALL photos
  const photos = await db
    .select()
    .from(companyCamPhotos)
    .execute();
  
  if (photos.length < 2) {
    return {
      success: true,
      message: "Not enough photos to compare",
      groupsFound: 0,
      photosDeleted: 0
    };
  }
  
  console.log(`[Photo Cleanup] Analyzing ${photos.length} photos for similarity...`);
  
  // Download photo helper
  const downloadPhoto = async (photoUrl: string): Promise<Buffer> => {
    if (photoUrl.startsWith('/public-objects/') || photoUrl.startsWith('/replit-objstore-')) {
      const photoPath = photoUrl.startsWith('/public-objects/') 
        ? photoUrl.replace('/public-objects/', '') 
        : photoUrl;
      const file = await objectStorageService.searchPublicObject(photoPath);
      if (!file) throw new Error(`Photo not found: ${photoPath}`);
      const [buffer] = await file.download();
      return buffer;
    } else if (photoUrl.startsWith('/attached_assets/')) {
      const fs = await import('fs/promises');
      const localPath = path.join(import.meta.dirname, '..', '..', photoUrl);
      return await fs.readFile(localPath);
    } else if (photoUrl.startsWith('http')) {
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error(`Failed to fetch: ${photoUrl}`);
      return Buffer.from(await response.arrayBuffer());
    } else {
      throw new Error(`Unknown photo URL format: ${photoUrl}`);
    }
  };
  
  // Find similar photos (map to expected type)
  const photosForComparison = photos.map(p => ({
    id: p.id,
    photoUrl: p.photoUrl,
    qualityScore: p.qualityScore ?? undefined,
    description: p.aiDescription ?? undefined
  }));
  
  const similarGroups = await findSimilarPhotos(photosForComparison, downloadPhoto);
  
  if (similarGroups.length === 0) {
    return {
      success: true,
      message: "No similar photos found",
      groupsFound: 0,
      photosDeleted: 0
    };
  }
  
  console.log(`[Photo Cleanup] Found ${similarGroups.length} groups of similar photos`);
  
  // Delete similar photos (keeping the best one from each group)
  let totalDeleted = 0;
  
  for (const group of similarGroups) {
    console.log(`[Photo Cleanup] Deleting ${group.photosToDelete.length} similar photos, keeping ${group.bestPhotoId}`);
    
    for (const photoId of group.photosToDelete) {
      await db
        .delete(companyCamPhotos)
        .where(eq(companyCamPhotos.id, photoId))
        .execute();
      
      totalDeleted++;
    }
  }
  
  console.log(`[Photo Cleanup] Similar photo cleanup complete: ${similarGroups.length} groups found, ${totalDeleted} photos deleted`);
  
  return {
    success: true,
    message: `Found ${similarGroups.length} groups of similar photos and deleted ${totalDeleted} duplicates`,
    groupsFound: similarGroups.length,
    photosDeleted: totalDeleted,
    groups: similarGroups.map(g => ({
      photoCount: g.photos.length,
      keptPhotoId: g.bestPhotoId,
      deletedCount: g.photosToDelete.length
    }))
  };
}

/**
 * Start the automated background job for photo cleanup
 */
export async function startAutomatedPhotoCleanup() {
  console.log('[Photo Cleanup] Starting automated similar photo cleanup system...');
  console.log('[Photo Cleanup] Will run daily (every 24 hours)');
  
  // Run once on startup (after a short delay to let server stabilize)
  setTimeout(async () => {
    await runCleanup();
  }, 60000); // Wait 1 minute after startup
  
  // Then run daily
  setInterval(async () => {
    await runCleanup();
  }, CHECK_INTERVAL);
}

async function runCleanup() {
  if (isRunning) {
    console.log('[Photo Cleanup] Cleanup already in progress, skipping this run');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  console.log('[Photo Cleanup] Starting automated similar photo detection and cleanup...');

  try {
    const result = await executePhotoCleanup();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result.groupsFound === 0) {
      console.log(`[Photo Cleanup] ✓ No similar photos found (completed in ${duration}s)`);
    } else {
      console.log(`[Photo Cleanup] ✓ Cleanup completed in ${duration}s:`);
      console.log(`  - Groups found: ${result.groupsFound}`);
      console.log(`  - Photos deleted: ${result.photosDeleted}`);
    }
  } catch (error) {
    console.error('[Photo Cleanup] ✗ Error during automated cleanup:', error);
  } finally {
    isRunning = false;
  }
}
