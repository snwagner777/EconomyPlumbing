import { getServiceTitanAPI } from "./serviceTitan";

// Mutex to prevent concurrent syncs
let syncInProgress = false;
let lastSyncHeartbeat = Date.now();

/**
 * Check if a ServiceTitan sync is currently running
 */
export function isSyncRunning(): boolean {
  // If sync has been "running" for more than 30 minutes without heartbeat, consider it stale
  if (syncInProgress && Date.now() - lastSyncHeartbeat > 30 * 60 * 1000) {
    console.log('[ServiceTitan Sync] ⚠️  Detected stale sync lock (no heartbeat for 30min), resetting...');
    syncInProgress = false;
  }
  return syncInProgress;
}

/**
 * Reset the sync mutex (admin tool only)
 */
export function resetSyncLock(): void {
  console.log('[ServiceTitan Sync] 🔓 Manually resetting sync lock...');
  syncInProgress = false;
  lastSyncHeartbeat = Date.now();
}

/**
 * Update heartbeat to prevent stale lock detection
 */
export function updateSyncHeartbeat(): void {
  lastSyncHeartbeat = Date.now();
}

/**
 * Sync all customers from ServiceTitan to local database
 * Protected by mutex to prevent concurrent execution
 */
export async function syncServiceTitanCustomers(): Promise<void> {
  // Check if sync is already running
  if (syncInProgress) {
    console.log('[ServiceTitan Sync] ⏭️  Sync already in progress, skipping...');
    return;
  }

  try {
    syncInProgress = true;
    console.log('[ServiceTitan Sync] Starting customer sync...');
    
    const serviceTitan = getServiceTitanAPI();
    const result = await serviceTitan.syncAllCustomers();
    
    console.log(`[ServiceTitan Sync] ✅ Customer sync completed!`);
    console.log(`[ServiceTitan Sync] - Customers synced: ${result.customersCount}`);
    console.log(`[ServiceTitan Sync] - Contacts synced: ${result.contactsCount}`);
    console.log(`[ServiceTitan Sync] - Duration: ${(result.duration / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error('[ServiceTitan Sync] ❌ Customer sync failed:', error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Sync all data from ServiceTitan to local database (customers + jobs)
 * Protected by mutex to prevent concurrent execution
 */
export async function syncServiceTitanData(): Promise<void> {
  // Check if sync is already running
  if (syncInProgress) {
    console.log('[ServiceTitan Sync] ⏭️  Sync already in progress, skipping...');
    return;
  }

  try {
    syncInProgress = true;
    const startTime = Date.now();
    console.log('[ServiceTitan Sync] 🚀 Starting full data sync (customers + jobs)...');
    
    const serviceTitan = getServiceTitanAPI();
    
    // Sync customers first
    console.log('[ServiceTitan Sync] 📋 Phase 1/2: Syncing customers...');
    updateSyncHeartbeat();
    const customerResult = await serviceTitan.syncAllCustomers();
    
    console.log(`[ServiceTitan Sync] ✅ Customer sync completed!`);
    console.log(`[ServiceTitan Sync] - Customers synced: ${customerResult.customersCount}`);
    console.log(`[ServiceTitan Sync] - Contacts synced: ${customerResult.contactsCount}`);
    console.log(`[ServiceTitan Sync] - Customer sync duration: ${(customerResult.duration / 1000).toFixed(1)}s`);
    
    // Sync jobs
    console.log('[ServiceTitan Sync] 📋 Phase 2/2: Syncing jobs...');
    updateSyncHeartbeat();
    const jobResult = await serviceTitan.syncAllJobs();
    
    console.log(`[ServiceTitan Sync] ✅ Job sync completed!`);
    console.log(`[ServiceTitan Sync] - Jobs fetched: ${jobResult.jobsFetched}`);
    console.log(`[ServiceTitan Sync] - Jobs processed: ${jobResult.jobsProcessed}`);
    console.log(`[ServiceTitan Sync] - Job sync duration: ${(jobResult.duration / 1000).toFixed(1)}s`);
    
    const totalDuration = (Date.now() - startTime) / 1000;
    console.log(`[ServiceTitan Sync] ✨ Full data sync completed in ${totalDuration.toFixed(1)}s`);
  } catch (error) {
    console.error('[ServiceTitan Sync] ❌ Data sync failed:', error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Start the ServiceTitan data sync scheduler
 * - Full sync every 6 hours (for complete data integrity)
 * - Runs initial sync on startup
 * - Syncs both customers and jobs
 */
export async function startServiceTitanSync(): Promise<void> {
  console.log('[ServiceTitan Sync] Scheduler started - will sync customers and jobs every 6 hours');
  
  // Run initial full sync on startup
  try {
    const { serviceTitanCustomers, serviceTitanJobs } = await import('@shared/schema');
    const { db } = await import('../db');
    const { count } = await import('drizzle-orm');
    
    const customerResult = await db.select({ count: count() }).from(serviceTitanCustomers);
    const customerCount = customerResult[0]?.count || 0;
    
    const jobResult = await db.select({ count: count() }).from(serviceTitanJobs);
    const jobCount = jobResult[0]?.count || 0;
    
    console.log(`[ServiceTitan Sync] 🚀 Starting full data sync...`);
    console.log(`[ServiceTitan Sync] 📊 Current cache: ${customerCount} customers, ${jobCount} jobs`);
    console.log('[ServiceTitan Sync] ⚠️  This may take 10-15 minutes for full data sync');
    
    // Run sync without blocking startup
    syncServiceTitanData().catch(error => {
      console.error('[ServiceTitan Sync] Initial sync failed:', error);
    });
  } catch (error) {
    console.error('[ServiceTitan Sync] Failed to check data counts:', error);
  }
  
  // Run full sync every 6 hours to keep cache fresh
  setInterval(() => {
    console.log('[ServiceTitan Sync] 🔄 Starting scheduled 6-hour data sync...');
    syncServiceTitanData().catch(error => {
      console.error('[ServiceTitan Sync] Scheduled sync failed:', error);
    });
  }, 6 * 60 * 60 * 1000); // 6 hours
}
