#!/usr/bin/env tsx
/**
 * Centralized Cron Job Runner for Replit Scheduled Deployments
 * 
 * This script replaces the unreliable setInterval approach in worker.ts.
 * It can be run by Replit Scheduled Deployments with different task arguments.
 * 
 * Usage:
 *   npx tsx server/cron.ts <task-name>
 * 
 * Available tasks:
 *   - emails-frequent: Review requests, referrals, custom campaigns (every 30 min)
 *   - reviews-fetch: Fetch Google reviews via SerpAPI (every 6 hours)
 *   - blog-weekly: Generate weekly blog post (every Monday 9am)
 *   - photos-sync: Sync photos from Google Drive (2x daily: 9am & 5pm)
 *   - photos-cleanup: Delete old unused photos (daily at 3am)
 */

import { storage } from "./storage";

const task = process.argv[2];

if (!task) {
  console.error('❌ Error: No task specified');
  console.error('Usage: npx tsx server/cron.ts <task-name>');
  console.error('\nAvailable tasks:');
  console.error('  - emails-frequent');
  console.error('  - reviews-fetch');
  console.error('  - blog-weekly');
  console.error('  - photos-sync');
  console.error('  - photos-cleanup');
  process.exit(1);
}

async function runTask(taskName: string) {
  const startTime = Date.now();
  console.log(`\n🚀 [CRON] Starting task: ${taskName}`);
  console.log(`⏰ [CRON] Timestamp: ${new Date().toISOString()}\n`);

  try {
    switch (taskName) {
      case 'emails-frequent':
        await runFrequentEmails();
        break;

      case 'reviews-fetch':
        await runReviewsFetch();
        break;

      case 'blog-weekly':
        await runWeeklyBlog();
        break;

      case 'photos-sync':
        await runPhotosSync();
        break;

      case 'photos-cleanup':
        await runPhotosCleanup();
        break;

      default:
        throw new Error(`Unknown task: ${taskName}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ [CRON] Task completed: ${taskName}`);
    console.log(`⏱️  [CRON] Duration: ${duration}s\n`);
    process.exit(0);

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ [CRON] Task failed: ${taskName}`);
    console.error(`⏱️  [CRON] Duration: ${duration}s`);
    console.error(`💥 [CRON] Error: ${error.message}\n`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * FREQUENT EMAILS (Every 30 minutes)
 * - Review request drip campaigns
 * - Referral nurture campaigns
 * - Custom email campaigns
 */
async function runFrequentEmails() {
  console.log('📧 Running frequent email tasks...\n');

  // 1. Review Request Emails
  try {
    console.log('   → Processing review request emails...');
    const { getReviewRequestScheduler } = await import('./lib/reviewRequestScheduler');
    const reviewScheduler = getReviewRequestScheduler();
    await reviewScheduler.processPendingEmails();
    console.log('   ✓ Review requests processed\n');
  } catch (error: any) {
    console.error('   ✗ Review requests failed:', error.message);
  }

  // 2. Referral Nurture Emails
  try {
    console.log('   → Processing referral nurture emails...');
    const { getReferralNurtureScheduler } = await import('./lib/referralNurtureScheduler');
    const referralScheduler = getReferralNurtureScheduler();
    await referralScheduler.processPendingEmails();
    console.log('   ✓ Referral nurture processed\n');
  } catch (error: any) {
    console.error('   ✗ Referral nurture failed:', error.message);
  }

  // 3. Custom Email Campaigns
  try {
    console.log('   → Processing custom campaigns...');
    const { CustomCampaignScheduler } = await import('./lib/customCampaignScheduler');
    const customScheduler = new CustomCampaignScheduler();
    await customScheduler.processCampaigns();
    console.log('   ✓ Custom campaigns processed\n');
  } catch (error: any) {
    console.error('   ✗ Custom campaigns failed:', error.message);
  }
}

/**
 * REVIEWS FETCH (Every 6 hours)
 * Fetch Google reviews via SerpAPI
 */
async function runReviewsFetch() {
  console.log('⭐ Fetching Google reviews via SerpAPI...\n');

  try {
    const { fetchGoogleReviewsViaSerpApi } = await import('./lib/serpApiReviews');
    const result = await fetchGoogleReviewsViaSerpApi();
    console.log(`   ✓ Reviews fetched: ${result.newReviews} new\n`);
  } catch (error: any) {
    console.error('   ✗ Reviews fetch failed:', error.message);
  }
}

/**
 * WEEKLY BLOG (Every Monday at 9am)
 * Generate and publish AI blog post from unused photos
 */
async function runWeeklyBlog() {
  console.log('📝 Generating weekly blog post...\n');

  try {
    const { manuallyGenerateBlogs } = await import('./lib/autoBlogGenerator');
    await manuallyGenerateBlogs(storage as any);
    console.log('   ✓ Blog generation complete\n');
  } catch (error: any) {
    console.error('   ✗ Blog generation failed:', error.message);
  }
}

/**
 * PHOTOS SYNC (2x daily: 9am & 5pm)
 * Sync photos from Google Drive
 */
async function runPhotosSync() {
  console.log('📸 Syncing photos from Google Drive...\n');

  try {
    const { monitorGoogleDriveFolder } = await import('./lib/googleDriveMonitor');
    await monitorGoogleDriveFolder();
    console.log('   ✓ Photo sync complete\n');
  } catch (error: any) {
    console.error('   ✗ Photo sync failed:', error.message);
  }
}

/**
 * PHOTOS CLEANUP (Daily at 3am)
 * Delete old unused photos older than 60 days
 */
async function runPhotosCleanup() {
  console.log('🧹 Cleaning up old photos...\n');

  try {
    const { cleanupOldUnusedPhotos } = await import('./lib/photoCleanupJob');
    await cleanupOldUnusedPhotos();
    console.log('   ✓ Photo cleanup complete\n');
  } catch (error: any) {
    console.error('   ✗ Photo cleanup failed:', error.message);
  }
}

// Run the task
runTask(task);
