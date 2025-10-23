#!/usr/bin/env tsx
/**
 * Script to sync ServiceTitan jobs directly
 * Bypasses the slow customer contact sync that's blocking the job sync
 */

async function syncJobs() {
  console.log('[Job Sync Script] Starting direct job sync...');
  
  try {
    // Import required modules
    const { getServiceTitanAPI } = await import('../lib/serviceTitan');
    
    // Get ServiceTitan API instance
    const serviceTitan = getServiceTitanAPI();
    
    console.log('[Job Sync Script] Initiating job sync...');
    
    // Run the job sync directly
    const result = await serviceTitan.syncAllJobs();
    
    console.log('[Job Sync Script] ✅ Job sync completed successfully!');
    console.log('[Job Sync Script] Results:', {
      jobsCount: result.jobsCount,
      customersUpdated: result.customersUpdated,
      duration: `${(result.duration / 1000).toFixed(1)}s`
    });
    
    process.exit(0);
  } catch (error) {
    console.error('[Job Sync Script] ❌ Error syncing jobs:', error);
    process.exit(1);
  }
}

// Run the sync
syncJobs();