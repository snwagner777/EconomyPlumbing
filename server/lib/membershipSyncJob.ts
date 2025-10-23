import { storage } from "../storage";
import { getServiceTitanAPI } from "./serviceTitan";
import { log } from "../vite";

interface SyncResult {
  membershipId: string;
  success: boolean;
  error?: string;
}

/**
 * Process a single membership sync to ServiceTitan
 */
async function processMembershipSync(membershipId: string): Promise<SyncResult> {
  try {
    // Get membership details
    const membership = await storage.getServiceTitanMembershipById(membershipId);
    
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    // Skip if already synced or syncing
    if (membership.syncStatus === 'synced' || membership.syncStatus === 'syncing') {
      return { membershipId, success: true };
    }

    // Update status to syncing
    await storage.updateServiceTitanMembership(membershipId, {
      syncStatus: 'syncing',
    });

    log(`[MembershipSync] Processing membership ${membershipId}...`);

    // Process through ServiceTitan API
    const serviceTitanAPI = getServiceTitanAPI();
    const result = await serviceTitanAPI.processMembershipPurchase(membership);

    // Update with successful sync
    await storage.updateServiceTitanMembership(membershipId, {
      serviceTitanCustomerId: result.customerId.toString(),
      serviceTitanMembershipId: result.membershipId.toString(),
      serviceTitanInvoiceId: result.invoiceId.toString(),
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      syncError: null,
    });

    log(`[MembershipSync] Successfully synced membership ${membershipId} - Customer: ${result.customerId}, Invoice: ${result.invoiceId}`);

    return { membershipId, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log(`[MembershipSync] ERROR processing membership ${membershipId}: ${errorMessage}`);

    // Update with error status
    try {
      await storage.updateServiceTitanMembership(membershipId, {
        syncStatus: 'failed',
        syncError: errorMessage,
      });
    } catch (updateError) {
      log(`[MembershipSync] ERROR updating membership ${membershipId} status: ${updateError}`);
    }

    return { 
      membershipId, 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Process all pending membership syncs
 * This is called periodically by the background job
 */
export async function processPendingMemberships(): Promise<void> {
  try {
    // Get all pending memberships
    const pendingMemberships = await storage.getPendingServiceTitanMemberships();

    if (pendingMemberships.length === 0) {
      return; // Nothing to process
    }

    log(`[MembershipSync] Found ${pendingMemberships.length} pending membership(s) to sync`);

    // Process each membership
    const results = await Promise.allSettled(
      pendingMemberships.map(m => processMembershipSync(m.id))
    );

    // Log summary
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    if (failed > 0) {
      log(`[MembershipSync] Batch complete: ${successful} succeeded, ${failed} failed`);
    } else {
      log(`[MembershipSync] Batch complete: ${successful} synced successfully`);
    }
  } catch (error) {
    log(`[MembershipSync] ERROR in batch processing: ${error}`);
  }
}

/**
 * Start the background job to process membership syncs
 * Runs every 30 seconds
 * NOTE: This is different from bulk customer sync - this only processes online membership purchases
 */
export function startMembershipSyncJob(): void {
  const INTERVAL = 30 * 1000; // 30 seconds

  // Run immediately on startup
  processPendingMemberships().catch(error => {
    log(`[MembershipSync] ERROR in initial run: ${error}`);
  });

  // Then run periodically
  setInterval(() => {
    processPendingMemberships().catch(error => {
      log(`[MembershipSync] ERROR in scheduled run: ${error}`);
    });
  }, INTERVAL);

  log('[MembershipSync] Background job started (runs every 30 seconds)');
}
