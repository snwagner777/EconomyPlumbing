#!/usr/bin/env tsx
/**
 * Script to manually process staged jobs
 */

async function processJobs() {
  console.log('[Process Jobs] Starting manual job processing...');
  
  const { db } = await import('../db');
  const { serviceTitanJobs, serviceTitanJobsStaging } = await import('@shared/schema');
  const { eq, isNull } = await import('drizzle-orm');
  
  try {
    // Get unprocessed staged jobs
    const stagedJobs = await db
      .select()
      .from(serviceTitanJobsStaging)
      .where(isNull(serviceTitanJobsStaging.processedAt))
      .limit(5); // Process just a few to test
    
    console.log(`[Process Jobs] Found ${stagedJobs.length} unprocessed staged jobs`);
    
    let processed = 0;
    let failed = 0;
    
    for (const staged of stagedJobs) {
      try {
        const job = staged.rawData as any;
        
        console.log(`[Process Jobs] Processing job ID ${job.id}...`);
        
        // Upsert to normalized jobs table
        await db
          .insert(serviceTitanJobs)
          .values({
            id: job.id,
            jobNumber: job.jobNumber,
            customerId: job.customerId,
            jobType: job.jobType || null,
            businessUnitId: job.businessUnitId || null,
            jobStatus: job.jobStatus,
            completedOn: job.completedOn ? new Date(job.completedOn) : null,
            total: Math.round((job.total || 0) * 100), // Convert to cents
            invoice: Math.round((job.invoice || 0) * 100),
            createdOn: new Date(job.createdOn),
            modifiedOn: new Date(job.modifiedOn),
            lastSyncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: serviceTitanJobs.id,
            set: {
              jobNumber: job.jobNumber,
              jobType: job.jobType || null,
              jobStatus: job.jobStatus,
              completedOn: job.completedOn ? new Date(job.completedOn) : null,
              total: Math.round((job.total || 0) * 100),
              invoice: Math.round((job.invoice || 0) * 100),
              modifiedOn: new Date(job.modifiedOn),
              lastSyncedAt: new Date(),
            },
          });
        
        // Mark as processed
        await db
          .update(serviceTitanJobsStaging)
          .set({ processedAt: new Date() })
          .where(eq(serviceTitanJobsStaging.id, staged.id));
        
        processed++;
        console.log(`[Process Jobs] ✅ Successfully processed job ${job.id}`);
        
      } catch (error) {
        console.error(`[Process Jobs] ❌ Error processing job:`, error);
        
        // Mark error but continue
        await db
          .update(serviceTitanJobsStaging)
          .set({ processingError: (error as Error).message })
          .where(eq(serviceTitanJobsStaging.id, staged.id));
        
        failed++;
      }
    }
    
    console.log(`[Process Jobs] Processing complete:`);
    console.log(`  - Processed: ${processed}`);
    console.log(`  - Failed: ${failed}`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Process Jobs] Fatal error:', error);
    process.exit(1);
  }
}

// Run the processing
processJobs();