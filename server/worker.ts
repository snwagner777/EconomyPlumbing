/**
 * Background Worker Process
 * 
 * Runs all background schedulers independently from the Next.js server:
 * - Review request emails (every 30 min)
 * - Referral nurture emails (every 30 min)
 * - GMB automation (reviews every 6 hours, replies every 15 min)
 * - Referral processing (hourly)
 * - Custom campaigns (every 30 min)
 * - Google Drive photo monitoring (every 5 min)
 * - Auto blog generation (weekly)
 * - Photo cleanup (daily at 3am)
 * - Membership sync (every 30 sec)
 */

import { storage } from "./storage";
import { startMembershipSyncJob } from "./lib/membershipSyncJob";
import { startAutoBlogGeneration } from "./lib/autoBlogGenerator";
import { startGoogleDriveMonitoring } from "./lib/googleDriveMonitor";
import { startPhotoCleanupJob } from "./lib/photoCleanupJob";
import { getReferralProcessor } from "./lib/referralProcessor";
import { startGMBAutomation } from "./lib/gmbAutomation";
import { getReviewRequestScheduler } from "./lib/reviewRequestScheduler";
import { getReferralNurtureScheduler } from "./lib/referralNurtureScheduler";
import { startCustomCampaignScheduler } from "./lib/customCampaignScheduler";

console.log('[Worker] Starting background job worker process...');

// Start membership sync background job
console.log('[Worker] Starting membership sync job...');
startMembershipSyncJob();

// Start automated blog generation (checks weekly for unused photos)
console.log('[Worker] Starting auto blog generation...');
startAutoBlogGeneration(storage as any);

// Start Google Drive monitoring (checks every 5 minutes for new photos)
console.log('[Worker] Starting Google Drive monitoring...');
startGoogleDriveMonitoring();

// Start photo cleanup job (runs daily at 3am to delete unused photos older than 60 days)
console.log('[Worker] Starting photo cleanup job...');
startPhotoCleanupJob();

// Start GMB automation (fetches reviews every 6 hours, auto-replies every 15 minutes)
console.log('[Worker] Starting GMB automation...');
startGMBAutomation();

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

// Start referral processor
console.log('[Worker] Starting referral processor...');
const referralProcessor = getReferralProcessor();

// Run once on startup after 5-second delay
setTimeout(() => {
  console.log('[Referral Processor] Running initial referral processing...');
  referralProcessor.processPendingReferrals().catch(err => {
    console.error('[Referral Processor] Error during initial processing:', err);
  });
}, 5000);

// Then run every hour
setInterval(() => {
  console.log('[Referral Processor] Running hourly referral processing...');
  referralProcessor.processPendingReferrals().catch(err => {
    console.error('[Referral Processor] Error during hourly processing:', err);
  });
}, 60 * 60 * 1000); // Every hour

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
