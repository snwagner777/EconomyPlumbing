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
    
    console.log(`[ServiceTitan Sync] ✅ Sync completed!`);
    console.log(`[ServiceTitan Sync] - Customers synced: ${result.customersCount}`);
    console.log(`[ServiceTitan Sync] - Contacts synced: ${result.contactsCount}`);
    console.log(`[ServiceTitan Sync] - Duration: ${(result.duration / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error('[ServiceTitan Sync] ❌ Sync failed:', error);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Start the ServiceTitan customer sync scheduler
 * - Full sync every 6 hours (for complete data integrity)
 * - Runs initial sync on startup
 */
export async function startServiceTitanSync(): Promise<void> {
  console.log('[ServiceTitan Sync] Scheduler started - will sync customers every 6 hours');
  
  // Run initial full sync on startup (no threshold - always sync all customers)
  try {
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { db } = await import('../db');
    const { count } = await import('drizzle-orm');
    
    const result = await db.select({ count: count() }).from(serviceTitanCustomers);
    const customerCount = result[0]?.count || 0;
    
    console.log(`[ServiceTitan Sync] 🚀 Starting full sync (current: ${customerCount} customers in cache)...`);
    console.log('[ServiceTitan Sync] ⚠️  This may take 5-10 minutes for ~11,000 customers');
    
    // Run sync without blocking startup
    syncServiceTitanCustomers().catch(error => {
      console.error('[ServiceTitan Sync] Initial sync failed:', error);
    });
  } catch (error) {
    console.error('[ServiceTitan Sync] Failed to check customer count:', error);
  }
  
  // Run full sync every 6 hours to keep cache fresh
  setInterval(() => {
    console.log('[ServiceTitan Sync] 🔄 Starting scheduled 6-hour sync...');
    syncServiceTitanCustomers().catch(error => {
      console.error('[ServiceTitan Sync] Scheduled sync failed:', error);
    });
  }, 6 * 60 * 60 * 1000); // 6 hours
}
