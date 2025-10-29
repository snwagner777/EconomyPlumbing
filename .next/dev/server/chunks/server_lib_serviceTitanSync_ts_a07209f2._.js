module.exports = [
"[project]/server/lib/serviceTitanSync.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSyncRunning",
    ()=>isSyncRunning,
    "resetSyncLock",
    ()=>resetSyncLock,
    "startServiceTitanSync",
    ()=>startServiceTitanSync,
    "syncServiceTitanCustomers",
    ()=>syncServiceTitanCustomers,
    "syncServiceTitanData",
    ()=>syncServiceTitanData,
    "updateSyncHeartbeat",
    ()=>updateSyncHeartbeat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$lib$2f$serviceTitan$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/server/lib/serviceTitan.ts [app-route] (ecmascript)");
;
// Mutex to prevent concurrent syncs
let syncInProgress = false;
let lastSyncHeartbeat = Date.now();
function isSyncRunning() {
    // If sync has been "running" for more than 30 minutes without heartbeat, consider it stale
    if (syncInProgress && Date.now() - lastSyncHeartbeat > 30 * 60 * 1000) {
        console.log('[ServiceTitan Sync] ⚠️  Detected stale sync lock (no heartbeat for 30min), resetting...');
        syncInProgress = false;
    }
    return syncInProgress;
}
function resetSyncLock() {
    console.log('[ServiceTitan Sync] 🔓 Manually resetting sync lock...');
    syncInProgress = false;
    lastSyncHeartbeat = Date.now();
}
function updateSyncHeartbeat() {
    lastSyncHeartbeat = Date.now();
}
async function syncServiceTitanCustomers() {
    // Check if sync is already running
    if (syncInProgress) {
        console.log('[ServiceTitan Sync] ⏭️  Sync already in progress, skipping...');
        return;
    }
    try {
        syncInProgress = true;
        console.log('[ServiceTitan Sync] Starting customer sync...');
        const serviceTitan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$lib$2f$serviceTitan$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServiceTitanAPI"])();
        const result = await serviceTitan.syncAllCustomers();
        console.log(`[ServiceTitan Sync] ✅ Customer sync completed!`);
        console.log(`[ServiceTitan Sync] - Customers synced: ${result.customersCount}`);
        console.log(`[ServiceTitan Sync] - Contacts synced: ${result.contactsCount}`);
        console.log(`[ServiceTitan Sync] - Duration: ${(result.duration / 1000).toFixed(1)}s`);
    } catch (error) {
        console.error('[ServiceTitan Sync] ❌ Customer sync failed:', error);
    } finally{
        syncInProgress = false;
    }
}
async function syncServiceTitanData() {
    // Check if sync is already running
    if (syncInProgress) {
        console.log('[ServiceTitan Sync] ⏭️  Sync already in progress, skipping...');
        return;
    }
    try {
        syncInProgress = true;
        const startTime = Date.now();
        console.log('[ServiceTitan Sync] 🚀 Starting full data sync (customers + jobs)...');
        const serviceTitan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$lib$2f$serviceTitan$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServiceTitanAPI"])();
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
        console.log(`[ServiceTitan Sync] - Jobs synced: ${jobResult.jobsCount}`);
        console.log(`[ServiceTitan Sync] - Customers updated: ${jobResult.customersUpdated}`);
        console.log(`[ServiceTitan Sync] - Job sync duration: ${(jobResult.duration / 1000).toFixed(1)}s`);
        const totalDuration = (Date.now() - startTime) / 1000;
        console.log(`[ServiceTitan Sync] ✨ Full data sync completed in ${totalDuration.toFixed(1)}s`);
    } catch (error) {
        console.error('[ServiceTitan Sync] ❌ Data sync failed:', error);
    } finally{
        syncInProgress = false;
    }
}
async function startServiceTitanSync() {
    console.log('[ServiceTitan Sync] Scheduler started - will sync customers and jobs every 6 hours');
    // Run initial full sync on startup
    try {
        const { customersXlsx, serviceTitanJobs } = await __turbopack_context__.A("[project]/shared/schema.ts [app-route] (ecmascript, async loader)");
        const { db } = await __turbopack_context__.A("[project]/server/db.ts [app-route] (ecmascript, async loader)");
        const { count } = await __turbopack_context__.A("[project]/node_modules/drizzle-orm/index.js [app-route] (ecmascript, async loader)");
        const customerResult = await db.select({
            count: count()
        }).from(customersXlsx);
        const customerCount = customerResult[0]?.count || 0;
        const jobResult = await db.select({
            count: count()
        }).from(serviceTitanJobs);
        const jobCount = jobResult[0]?.count || 0;
        console.log(`[ServiceTitan Sync] 🚀 Starting full data sync...`);
        console.log(`[ServiceTitan Sync] 📊 Current cache: ${customerCount} customers, ${jobCount} jobs`);
        // Run sync without blocking startup
        syncServiceTitanData().catch((error)=>{
            console.error('[ServiceTitan Sync] Initial sync failed:', error);
        });
    } catch (error) {
        console.error('[ServiceTitan Sync] Failed to check data counts:', error);
    }
    // Run full sync every 6 hours to keep cache fresh
    setInterval(()=>{
        console.log('[ServiceTitan Sync] 🔄 Starting scheduled 6-hour data sync...');
        syncServiceTitanData().catch((error)=>{
            console.error('[ServiceTitan Sync] Scheduled sync failed:', error);
        });
    }, 6 * 60 * 60 * 1000); // 6 hours
}
}),
];

//# sourceMappingURL=server_lib_serviceTitanSync_ts_a07209f2._.js.map