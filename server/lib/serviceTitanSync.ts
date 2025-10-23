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
 * DISABLED: ServiceTitan API sync replaced with XLSX email imports
 * Customer data now imported via hourly XLSX reports from ServiceTitan via Mailgun webhook
 */
export async function syncServiceTitanCustomers(): Promise<void> {
  console.log('[ServiceTitan Sync] ⚠️  API sync disabled - using XLSX email imports instead');
  return;
}

/**
 * DISABLED: ServiceTitan API sync replaced with XLSX email imports
 * Customer data now imported via hourly XLSX reports from ServiceTitan via Mailgun webhook
 */
export async function syncServiceTitanData(): Promise<void> {
  console.log('[ServiceTitan Sync] ⚠️  API sync disabled - using XLSX email imports instead');
  return;
}

/**
 * DISABLED: ServiceTitan API sync replaced with XLSX email imports
 * Customer data now imported via hourly XLSX reports from ServiceTitan via Mailgun webhook
 */
export async function startServiceTitanSync(): Promise<void> {
  console.log('[ServiceTitan Sync] ⚠️  Scheduler disabled - customer data now imported via XLSX email reports from ServiceTitan via Mailgun');
  return;
}
