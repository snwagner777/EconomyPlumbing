import { storage } from "../storage";
import { ObjectStorageService } from "../objectStorage";

const objectStorageService = new ObjectStorageService();

/**
 * Delete unused photos older than 60 days
 */
export async function cleanupOldUnusedPhotos(): Promise<void> {
  try {
    console.log('[Photo Cleanup] Starting cleanup of unused photos older than 60 days...');
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    let deletedCount = 0;
    
    // Clean up imported photos
    const importedPhotos = await storage.getAllImportedPhotos();
    const unusedImportedPhotos = importedPhotos.filter(photo => {
      const createdAt = photo.createdAt ? new Date(photo.createdAt) : null;
      return (
        !photo.usedInBlog && 
        !photo.usedInBlogPostId && 
        !photo.usedInPageUrl &&
        createdAt && 
        createdAt < sixtyDaysAgo
      );
    });
    
    console.log(`[Photo Cleanup] Found ${unusedImportedPhotos.length} unused imported photos older than 60 days`);
    
    for (const photo of unusedImportedPhotos) {
      try {
        // Delete from object storage if it's stored there
        if (photo.url.startsWith('/replit-objstore-') || photo.url.startsWith('/public-objects/')) {
          try {
            await objectStorageService.deleteObject(photo.url);
            console.log(`[Photo Cleanup] ✓ Deleted from object storage: ${photo.url}`);
          } catch (error) {
            console.error(`[Photo Cleanup] Failed to delete from object storage: ${photo.url}`, error);
          }
        }
        
        // Delete from database
        await storage.deleteImportedPhoto(photo.id);
        deletedCount++;
        console.log(`[Photo Cleanup] ✓ Deleted imported photo: ${photo.id}`);
      } catch (error) {
        console.error(`[Photo Cleanup] Error deleting imported photo ${photo.id}:`, error);
      }
    }
    
    // Clean up CompanyCam photos
    const companyCamPhotos = await storage.getAllPhotos();
    const unusedCompanyCamPhotos = companyCamPhotos.filter(photo => {
      const fetchedAt = photo.fetchedAt ? new Date(photo.fetchedAt) : null;
      return (
        !photo.usedInBlogPostId && 
        !photo.usedInPageUrl &&
        fetchedAt && 
        fetchedAt < sixtyDaysAgo
      );
    });
    
    console.log(`[Photo Cleanup] Found ${unusedCompanyCamPhotos.length} unused CompanyCam photos older than 60 days`);
    
    for (const photo of unusedCompanyCamPhotos) {
      try {
        // Delete from object storage if it's stored there
        if (photo.photoUrl.startsWith('/replit-objstore-') || photo.photoUrl.startsWith('/public-objects/')) {
          try {
            await objectStorageService.deleteObject(photo.photoUrl);
            console.log(`[Photo Cleanup] ✓ Deleted from object storage: ${photo.photoUrl}`);
          } catch (error) {
            console.error(`[Photo Cleanup] Failed to delete from object storage: ${photo.photoUrl}`, error);
          }
        }
        
        // Delete from database
        await storage.deleteCompanyCamPhoto(photo.id);
        deletedCount++;
        console.log(`[Photo Cleanup] ✓ Deleted CompanyCam photo: ${photo.id}`);
      } catch (error) {
        console.error(`[Photo Cleanup] Error deleting CompanyCam photo ${photo.id}:`, error);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[Photo Cleanup] ✅ Cleanup complete! Deleted ${deletedCount} unused photos`);
    } else {
      console.log('[Photo Cleanup] No unused photos to delete');
    }
  } catch (error) {
    console.error('[Photo Cleanup] Error during cleanup:', error);
  }
}

/**
 * Start the photo cleanup scheduler (runs daily at 3am)
 */
export function startPhotoCleanupJob(): void {
  console.log('[Photo Cleanup] Scheduler started - will check daily at 3am for unused photos older than 60 days');
  
  // Check every hour if it's time to run
  setInterval(checkAndCleanup, 60 * 60 * 1000); // 1 hour
}

async function checkAndCleanup(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  
  // Run at 3am every day
  if (hour === 3) {
    await cleanupOldUnusedPhotos();
  }
}
