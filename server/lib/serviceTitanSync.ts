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
 * Also runs an initial sync on startup if database is empty
 */
export async function startServiceTitanSync(): Promise<void> {
  console.log('[ServiceTitan Sync] Scheduler started - will sync customers daily at 3am');
  
  // Run initial sync on startup if database is empty or incomplete
  try {
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { db } = await import('../db');
    const { count } = await import('drizzle-orm');
    
    const result = await db.select({ count: count() }).from(serviceTitanCustomers);
    const customerCount = result[0]?.count || 0;
    
    // Always sync if we have less than 10,000 customers (ServiceTitan has ~11,000+)
    if (customerCount < 10000) {
      console.log(`[ServiceTitan Sync] 🚀 Found ${customerCount} customers in cache - running full sync to catch up...`);
      console.log('[ServiceTitan Sync] ⚠️  This may take 5-10 minutes for ~11,000 customers');
      
      // Run sync without blocking startup
      syncServiceTitanCustomers().catch(error => {
        console.error('[ServiceTitan Sync] Initial sync failed:', error);
      });
    } else {
      console.log(`[ServiceTitan Sync] ✅ Database has ${customerCount} customers - sync complete`);
    }
  } catch (error) {
    console.error('[ServiceTitan Sync] Failed to check customer count:', error);
  }
  
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
