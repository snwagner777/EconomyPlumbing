#!/usr/bin/env tsx
/**
 * Script to process ALL staged jobs and update customer counts
 */

async function processAllJobs() {
  console.log('[Process All Jobs] Starting...');
  
  const { db } = await import('../db');
  const { serviceTitanJobs, serviceTitanJobsStaging, customersXlsx } = await import('@shared/schema');
  const { eq, isNull, sql } = await import('drizzle-orm');
  
  try {
    // Get ALL unprocessed staged jobs
    const stagedJobs = await db
      .select()
      .from(serviceTitanJobsStaging)
      .where(isNull(serviceTitanJobsStaging.processedAt));
    
    console.log(`[Process All Jobs] Found ${stagedJobs.length} unprocessed staged jobs`);
    
    let processed = 0;
    let failed = 0;
    
    for (const staged of stagedJobs) {
      try {
        const job = staged.rawData as any;
        
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
        if (processed % 50 === 0) {
          console.log(`[Process All Jobs] Processed ${processed}/${stagedJobs.length} jobs...`);
        }
        
      } catch (error) {
        console.error(`[Process All Jobs] ❌ Error processing job ID ${(staged.rawData as any).id}:`, (error as Error).message);
        
        // Mark error but continue
        await db
          .update(serviceTitanJobsStaging)
          .set({ processingError: (error as Error).message })
          .where(eq(serviceTitanJobsStaging.id, staged.id));
        
        failed++;
      }
    }
    
    console.log(`[Process All Jobs] ✅ Processing complete:`);
    console.log(`  - Processed: ${processed}`);
    console.log(`  - Failed: ${failed}`);
    
    // Now update customer job counts
    console.log('[Process All Jobs] 📊 Updating customer job counts...');
    
    await db.execute(sql`
      UPDATE service_titan_customers c
      SET job_count = (
        SELECT COUNT(*)
        FROM service_titan_jobs j
        WHERE j.customer_id = c.id
          AND j.job_status = 'Completed'
          AND j.completed_on IS NOT NULL
      )
    `);
    
    const customersUpdatedResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM service_titan_customers 
      WHERE job_count > 0
    `);
    
    const customersWithJobs = (customersUpdatedResult.rows[0] as any).count;
    
    console.log(`[Process All Jobs] ✅ Updated ${customersWithJobs} customers with job counts`);
    
    // Show some stats
    const stats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN job_status = 'Completed' THEN 1 END) as completed_jobs,
        MIN(completed_on) as earliest_job,
        MAX(completed_on) as latest_job
      FROM service_titan_jobs
    `);
    
    console.log('[Process All Jobs] 📊 Database stats:', stats.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('[Process All Jobs] Fatal error:', error);
    process.exit(1);
  }
}

// Run the processing
processAllJobs();