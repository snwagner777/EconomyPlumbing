import { storage } from "../storage";
import type { CompanyCamPhoto } from "@shared/schema";
import { processBeforeAfterPairs } from "./beforeAfterComposer";

/**
 * Get photos uploaded in the last 24 hours, grouped by job ID
 */
async function getRecentPhotosByJob(): Promise<Map<string, CompanyCamPhoto[]>> {
  const allPhotos = await storage.getAllPhotos();
  
  // Calculate 24 hours ago
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  // Filter to photos from last 24 hours
  const recentPhotos = allPhotos.filter(photo => {
    const uploadedAt = photo.uploadedAt ? new Date(photo.uploadedAt) : null;
    return uploadedAt && uploadedAt >= twentyFourHoursAgo;
  });
  
  console.log(`[Daily Composite] Found ${recentPhotos.length} photos from last 24 hours`);
  
  // Group by job ID (skip photos without a job ID to prevent cross-job mixing)
  const photosByJob = new Map<string, CompanyCamPhoto[]>();
  let skippedCount = 0;
  
  for (const photo of recentPhotos) {
    const jobId = photo.companyCamProjectId;
    
    // Skip photos without a job ID - they cannot be safely grouped
    if (!jobId) {
      skippedCount++;
      console.log(`[Daily Composite] ⏭️  Skipping photo ${photo.id} - missing job ID`);
      continue;
    }
    
    if (!photosByJob.has(jobId)) {
      photosByJob.set(jobId, []);
    }
    photosByJob.get(jobId)!.push(photo);
  }
  
  if (skippedCount > 0) {
    console.log(`[Daily Composite] ⚠️  Skipped ${skippedCount} photos without job IDs`);
  }
  
  // Filter to jobs with at least 2 photos
  const jobsWithMultiplePhotos = new Map<string, CompanyCamPhoto[]>();
  for (const [jobId, photos] of Array.from(photosByJob.entries())) {
    if (photos.length >= 2) {
      jobsWithMultiplePhotos.set(jobId, photos);
    }
  }
  
  console.log(`[Daily Composite] Found ${jobsWithMultiplePhotos.size} jobs with 2+ photos`);
  
  return jobsWithMultiplePhotos;
}

/**
 * Check if we've already run the composite job today
 */
async function hasRunToday(): Promise<boolean> {
  const composites = await storage.getBeforeAfterComposites();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysComposites = composites.filter(c => {
    const createdDate = new Date(c.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  });
  
  return todaysComposites.length > 0;
}

/**
 * Daily job to create before/after composites from recent photos
 */
export async function createDailyComposites(): Promise<void> {
  try {
    console.log('[Daily Composite] Starting daily before/after composite creation...');
    
    // Check if already run today
    if (await hasRunToday()) {
      console.log('[Daily Composite] Already ran today, skipping');
      return;
    }
    
    // Get recent photos grouped by job
    const photosByJob = await getRecentPhotosByJob();
    
    if (photosByJob.size === 0) {
      console.log('[Daily Composite] No jobs with multiple photos found');
      return;
    }
    
    let totalCompositesCreated = 0;
    
    // Process each job
    for (const [jobId, photos] of Array.from(photosByJob.entries())) {
      try {
        console.log(`[Daily Composite] Processing job ${jobId} with ${photos.length} photos...`);
        
        // Detect and create before/after pairs
        const composites = await processBeforeAfterPairs(photos, jobId);
        
        // Save composites to database
        for (const composite of composites) {
          await storage.saveBeforeAfterComposite(composite);
          totalCompositesCreated++;
          console.log(`[Daily Composite] ✅ Created composite for job ${jobId}`);
        }
      } catch (error) {
        console.error(`[Daily Composite] Error processing job ${jobId}:`, error);
      }
    }
    
    console.log(`[Daily Composite] ✅ Complete! Created ${totalCompositesCreated} composites from ${photosByJob.size} jobs`);
  } catch (error) {
    console.error('[Daily Composite] Error in daily composite job:', error);
  }
}

/**
 * Start the daily composite scheduler (runs every hour to check if it's time)
 */
export function startDailyCompositeJob(): void {
  console.log('[Daily Composite] Scheduler started - will check every 24 hours for new before/after pairs');
  
  // Run immediately on startup
  checkAndCreate();
  
  // Then check every hour (will only run once per day)
  setInterval(checkAndCreate, 60 * 60 * 1000); // 1 hour
}

async function checkAndCreate(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  
  // Run at 2am every day (quieter time, after most photos have been uploaded)
  if (hour === 2) {
    await createDailyComposites();
  }
}
