/**
 * Background Worker Process
 * 
 * Runs all background schedulers independently from the Next.js server:
 * - Review request emails (every 30 min)
 * - Referral nurture emails (every 30 min)
 * - GMB automation (reviews every 6 hours, replies every 15 min)
 * - Referral processing (hourly)
 * - Custom campaigns (every 30 min)
 * - ServiceTitan photo fetch queue (every 1 min)
 * - Auto blog generation (weekly)
 * - Photo cleanup (daily at 3am)
 * - ServiceTitan zone sync (daily at 3am CT)
 */

import { storage } from "./storage";
import { startAutoBlogGeneration } from "./lib/autoBlogGenerator";
import { startPhotoCleanupJob } from "./lib/photoCleanupJob";
import { syncZonesFromServiceTitan } from "./lib/zoneSyncService";
// DEPRECATED: Old ServiceTitan job scanning system - replaced by voucher-based QR code system
// import { getReferralProcessor } from "./lib/referralProcessor";
// GMB automation removed - rebuilding with SimpleTexting integration
import { getReviewRequestScheduler } from "./lib/reviewRequestScheduler";
import { getReferralNurtureScheduler } from "./lib/referralNurtureScheduler";
import { startCustomCampaignScheduler } from "./lib/customCampaignScheduler";
import { serviceTitanPhotoFetcher } from "./lib/servicetitanPhotoFetcher";
import { seoAuditProcessor } from "./lib/seoAuditProcessor";

console.log('[Worker] Starting background job worker process...');

// Membership sync removed - now using live ServiceTitan API calls instead of database cache
// Customer Portal fetches memberships directly from /api/customer-portal/memberships

// Start automated blog generation (checks weekly for unused photos)
console.log('[Worker] Starting auto blog generation...');
startAutoBlogGeneration(storage as any);

// Start photo cleanup job (runs daily at 3am to delete unused photos older than 60 days)
console.log('[Worker] Starting photo cleanup job...');
startPhotoCleanupJob();

// GMB automation temporarily disabled - rebuilding with SimpleTexting integration

// Start review request and referral nurture email schedulers
console.log('[Worker] Starting email schedulers...');

const reviewRequestScheduler = getReviewRequestScheduler();
const referralNurtureScheduler = getReferralNurtureScheduler();

// Review request scheduler - runs every 30 minutes
setInterval(() => {
  console.log('[Review Request Scheduler] Running scheduled email check...');
  reviewRequestScheduler.processPendingEmails().catch((err: Error) => {
    console.error('[Review Request Scheduler] Error processing emails:', err);
  });
}, 30 * 60 * 1000); // Every 30 minutes

// Referral nurture scheduler - runs every 30 minutes
setInterval(() => {
  console.log('[Referral Nurture Scheduler] Running scheduled email check...');
  referralNurtureScheduler.processPendingEmails().catch((err: Error) => {
    console.error('[Referral Nurture Scheduler] Error processing emails:', err);
  });
}, 30 * 60 * 1000); // Every 30 minutes

// Run immediately on startup (after 10-second delay for database readiness)
setTimeout(() => {
  console.log('[Schedulers] Running initial email processing...');
  reviewRequestScheduler.processPendingEmails().catch((err: Error) => {
    console.error('[Review Request Scheduler] Error during initial processing:', err);
  });
  referralNurtureScheduler.processPendingEmails().catch((err: Error) => {
    console.error('[Referral Nurture Scheduler] Error during initial processing:', err);
  });
}, 10000);

// Start custom campaign scheduler
console.log('[Worker] Starting custom campaign scheduler...');
startCustomCampaignScheduler();

// Start ServiceTitan photo fetch queue processor - runs every minute
console.log('[Worker] Starting ServiceTitan photo fetch queue processor...');

setInterval(() => {
  console.log('[Photo Fetcher] Processing photo fetch queue...');
  serviceTitanPhotoFetcher.processQueue().catch((err: Error) => {
    console.error('[Photo Fetcher] Error processing queue:', err);
  });
}, 60 * 1000); // Every 1 minute

// Run immediately on startup (after 15-second delay for database readiness)
setTimeout(() => {
  console.log('[Photo Fetcher] Running initial photo queue processing...');
  serviceTitanPhotoFetcher.processQueue().catch((err: Error) => {
    console.error('[Photo Fetcher] Error during initial processing:', err);
  });
}, 15000);

// Start SEO audit processor - runs every 2 minutes
console.log('[Worker] Starting SEO audit processor...');

setInterval(() => {
  console.log('[SEO Audit Processor] Processing audit queue...');
  seoAuditProcessor.processQueue().catch((err: Error) => {
    console.error('[SEO Audit Processor] Error processing queue:', err);
  });
}, 120 * 1000); // Every 2 minutes

// Run immediately on startup (after 20-second delay for database readiness)
setTimeout(() => {
  console.log('[SEO Audit Processor] Running initial audit queue processing...');
  seoAuditProcessor.processQueue().catch((err: Error) => {
    console.error('[SEO Audit Processor] Error during initial processing:', err);
  });
}, 20000);

// DEPRECATED: Old referral processor replaced by voucher-based QR code system
// Referrals now use instant voucher creation (app/api/referrals/submit)
// and QR code scanning (app/customer-portal/scan) instead of job matching
// console.log('[Worker] Starting referral processor...');
// const referralProcessor = getReferralProcessor();
// 
// // Run once on startup after 5-second delay
// setTimeout(() => {
//   console.log('[Referral Processor] Running initial referral processing...');
//   referralProcessor.processPendingReferrals().catch(err => {
//     console.error('[Referral Processor] Error during initial processing:', err);
//   });
// }, 5000);
// 
// // Then run every hour
// setInterval(() => {
//   console.log('[Referral Processor] Running hourly referral processing...');
//   referralProcessor.processPendingReferrals().catch(err => {
//     console.error('[Referral Processor] Error during hourly processing:', err);
//   });
// }, 60 * 60 * 1000); // Every hour

// Zone sync - runs daily at 3 AM CT (same as photo cleanup)
const scheduleZoneSync = () => {
  const now = new Date();
  
  // Convert current time to Central Time to find next 3 AM CT
  const nowCT = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const todayAt3AMCT = new Date(nowCT);
  todayAt3AMCT.setHours(3, 0, 0, 0);
  
  // Calculate next 3 AM CT in UTC
  const next3AMCT = nowCT > todayAt3AMCT 
    ? new Date(todayAt3AMCT.getTime() + 24 * 60 * 60 * 1000) // Tomorrow at 3 AM CT
    : todayAt3AMCT; // Today at 3 AM CT
  
  // Convert back to UTC for setTimeout
  const ctOffset = now.getTime() - nowCT.getTime();
  const next3AMUTC = new Date(next3AMCT.getTime() + ctOffset);
  
  const msUntilSync = next3AMUTC.getTime() - now.getTime();
  console.log(`[Zone Sync] Next sync scheduled for ${next3AMUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT (in ${Math.round(msUntilSync / 1000 / 60 / 60)} hours)`);

  setTimeout(async () => {
    try {
      console.log('[Zone Sync] Starting daily zone sync...');
      await syncZonesFromServiceTitan();
    } catch (error) {
      console.error('[Zone Sync] Error during sync:', error);
    }
    
    // Schedule next sync (24 hours from now)
    scheduleZoneSync();
  }, msUntilSync);
};

console.log('[Worker] Starting zone sync scheduler...');
scheduleZoneSync();

console.log('[Worker] All background jobs started successfully');
console.log('[Worker] Process will run indefinitely...');

// Keep process alive
process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received, shutting down gracefully...');
  process.exit(0);
});
