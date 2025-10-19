import { getServiceTitanAPI } from "./serviceTitan";

// Mutex to prevent concurrent syncs
let syncInProgress = false;

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
 * Start the ServiceTitan customer sync scheduler (runs daily at 3am)
 */
export function startServiceTitanSync(): void {
  console.log('[ServiceTitan Sync] Scheduler started - will sync customers daily at 3am');
  
  // Check every hour if it's time to run
  setInterval(checkAndSync, 60 * 60 * 1000); // 1 hour
}

async function checkAndSync(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  
  // Run at 3am every day
  if (hour === 3) {
    await syncServiceTitanCustomers();
  }
}
