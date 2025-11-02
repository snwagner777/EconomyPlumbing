/**
 * Background Worker Process for Next.js Migration
 * 
 * This file runs as a separate process (via Procfile) to handle all
 * background schedulers and periodic jobs. It runs independently of
 * the Next.js web server to ensure background tasks don't block web requests.
 * 
 * Architecture:
 * - Next.js handles web pages and API routes
 * - worker.ts handles all background jobs (14 schedulers)
 * - Both processes share the same database
 */

import { db } from './server/db';
import { fetchGoogleReviews } from './server/lib/googleReviews';
import { storage } from './server/storage';
import type { InsertGoogleReview } from '@shared/schema';

// Scheduler imports
import { startMembershipSyncJob } from './server/lib/membershipSyncJob';
import { startAutoBlogGeneration } from './server/lib/autoBlogGenerator';
import { startGoogleDriveMonitoring } from './server/lib/googleDriveMonitor';
import { startDailyCompositeJob } from './server/lib/dailyCompositeJob';
import { startPhotoCleanupJob } from './server/lib/photoCleanupJob';
import { getReferralProcessor } from './server/lib/referralProcessor';
import { startGMBAutomation } from './server/lib/gmbAutomation';
import { getReviewRequestScheduler } from './server/lib/reviewRequestScheduler';
import { getReferralNurtureScheduler } from './server/lib/referralNurtureScheduler';
import { startCustomCampaignScheduler } from './server/lib/customCampaignScheduler';
import { initHealthAlerterScheduler } from './server/lib/healthAlerterScheduler';
import { startAutomatedPhotoCleanup } from './server/lib/automatedPhotoCleanup';

interface SchedulerInfo {
  name: string;
  interval: number; // in milliseconds
  enabled: boolean;
  lastRun?: Date;
  runCount: number;
  errorCount: number;
}

class WorkerRegistry {
  private schedulers: Map<string, SchedulerInfo> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    console.log('[Worker] Initializing background worker process...');
  }

  /**
   * Register a scheduler in the registry
   */
  register(name: string, interval: number, enabled: boolean = true): void {
    this.schedulers.set(name, {
      name,
      interval,
      enabled,
      runCount: 0,
      errorCount: 0
    });
    console.log(`[Worker] Registered: ${name} (${interval}ms, enabled: ${enabled})`);
  }

  /**
   * Start a scheduler with automatic error handling and tracking
   */
  start(name: string, task: () => Promise<void>): void {
    const scheduler = this.schedulers.get(name);
    if (!scheduler) {
      console.error(`[Worker] Cannot start unregistered scheduler: ${name}`);
      return;
    }

    if (!scheduler.enabled) {
      console.log(`[Worker] Skipping disabled scheduler: ${name}`);
      return;
    }

    console.log(`[Worker] Starting scheduler: ${name}`);

    // Wrapped task with error handling and tracking
    const wrappedTask = async () => {
      const scheduler = this.schedulers.get(name)!;
      try {
        console.log(`[Worker] Running: ${name}`);
        await task();
        scheduler.runCount++;
        scheduler.lastRun = new Date();
        console.log(`[Worker] ✓ Completed: ${name} (run #${scheduler.runCount})`);
      } catch (error) {
        scheduler.errorCount++;
        console.error(`[Worker] ✗ Error in ${name}:`, error);
        
        // Alert admin if errors are frequent
        if (scheduler.errorCount >= 3) {
          console.error(`[Worker] ALERT: ${name} has failed ${scheduler.errorCount} times`);
          // TODO: Send admin alert email via Resend
        }
      }
    };

    // Run immediately on startup (after 5 second delay)
    setTimeout(wrappedTask, 5000);

    // Then run on interval
    const intervalId = setInterval(wrappedTask, scheduler.interval);
    this.intervals.set(name, intervalId);
  }

  /**
   * Stop a specific scheduler
   */
  stop(name: string): void {
    const intervalId = this.intervals.get(name);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(name);
      console.log(`[Worker] Stopped: ${name}`);
    }
  }

  /**
   * Stop all schedulers
   */
  stopAll(): void {
    console.log('[Worker] Stopping all schedulers...');
    for (const [name, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId);
      console.log(`[Worker] Stopped: ${name}`);
    }
    this.intervals.clear();
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Get health status of all schedulers
   */
  getHealth(): Record<string, any> {
    const health: Record<string, any> = {
      timestamp: new Date().toISOString(),
      schedulers: {}
    };

    for (const [name, info] of this.schedulers.entries()) {
      health.schedulers[name] = {
        enabled: info.enabled,
        interval: info.interval,
        runCount: info.runCount,
        errorCount: info.errorCount,
        lastRun: info.lastRun?.toISOString() || null,
        healthy: info.errorCount < 3
      };
    }

    return health;
  }

  /**
   * Start periodic health check logging
   */
  startHealthCheck(): void {
    console.log('[Worker] Starting health check monitor...');
    
    this.healthCheckInterval = setInterval(() => {
      const health = this.getHealth();
      console.log('[Worker] Health Check:', JSON.stringify(health, null, 2));
      
      // Check for unhealthy schedulers
      for (const [name, info] of Object.entries(health.schedulers)) {
        if (!(info as any).healthy) {
          console.error(`[Worker] UNHEALTHY SCHEDULER: ${name} has ${(info as any).errorCount} errors`);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

// Create singleton registry
const registry = new WorkerRegistry();

/**
 * Seed service areas if database is empty
 */
async function seedServiceAreas(): Promise<void> {
  try {
    console.log('[Worker] Checking service areas in database...');
    const existingAreas = await storage.getAllServiceAreas();
    console.log(`[Worker] Found ${existingAreas.length} existing service areas`);
    
    if (existingAreas.length > 0) {
      console.log('[Worker] Service areas already exist in database');
      return;
    }

    console.log('[Worker] Seeding service areas to database...');
    
    // Import service area data from MemStorage
    const { MemStorage } = await import('./server/storage');
    const memStorage = new MemStorage();
    const serviceAreas = await memStorage.getAllServiceAreas();
    console.log(`[Worker] Loaded ${serviceAreas.length} service areas from MemStorage`);
    
    // Insert each service area into database
    let count = 0;
    for (const area of serviceAreas) {
      await storage.createServiceArea(area);
      count++;
      if (count % 5 === 0) {
        console.log(`[Worker] Seeded ${count}/${serviceAreas.length} service areas...`);
      }
    }
    
    console.log(`[Worker] Successfully seeded ${serviceAreas.length} service areas`);
  } catch (error) {
    console.error('[Worker] ERROR seeding service areas:', error);
  }
}

/**
 * Initialize all background schedulers
 */
async function initializeWorker(): Promise<void> {
  console.log('[Worker] ========================================');
  console.log('[Worker] Starting Background Worker Process');
  console.log('[Worker] ========================================');

  // Seed database if needed
  try {
    await seedServiceAreas();
  } catch (error) {
    console.error('[Worker] Failed to seed service areas:', error);
  }

  // Register all schedulers
  registry.register('google-reviews', 24 * 60 * 60 * 1000, true); // 24 hours
  registry.register('membership-sync', 30 * 1000, true); // 30 seconds
  registry.register('auto-blog', 7 * 24 * 60 * 60 * 1000, true); // 7 days
  registry.register('google-drive', 5 * 60 * 1000, true); // 5 minutes
  registry.register('photo-cleanup', 60 * 60 * 1000, true); // 1 hour (checks for 3am)
  registry.register('gmb-fetch', 6 * 60 * 60 * 1000, true); // 6 hours
  registry.register('gmb-reply', 15 * 60 * 1000, true); // 15 minutes
  registry.register('review-requests', 30 * 60 * 1000, true); // 30 minutes
  registry.register('referral-nurture', 30 * 60 * 1000, true); // 30 minutes
  registry.register('custom-campaigns', 30 * 60 * 1000, true); // 30 minutes
  registry.register('referral-processor', 60 * 60 * 1000, true); // 1 hour
  registry.register('health-alerter', 5 * 60 * 1000, true); // 5 minutes
  registry.register('automated-photo-cleanup', 24 * 60 * 60 * 1000, true); // 24 hours
  registry.register('daily-composite', 60 * 60 * 1000, false); // 1 hour (disabled)

  // Start Google Reviews refresh
  registry.start('google-reviews', async () => {
    console.log('[Worker] Fetching Google reviews...');
    const reviews = await fetchGoogleReviews();
    
    if (reviews.length === 0) {
      console.log('[Worker] No new reviews');
      return;
    }

    const existingReviews = await storage.getGoogleReviews();
    const existingByContent = new Map(
      existingReviews.map(r => [`${r.text}:${r.timestamp}`, r])
    );

    const newReviews: InsertGoogleReview[] = [];
    for (const review of reviews) {
      if (review.rating < 4) continue;
      const key = `${review.text}:${review.timestamp}`;
      if (!existingByContent.has(key)) {
        newReviews.push(review);
      }
    }

    if (newReviews.length > 0) {
      await storage.saveGoogleReviews(newReviews);
      console.log(`[Worker] Added ${newReviews.length} new reviews`);
    }
  });

  // Start membership sync
  registry.start('membership-sync', async () => {
    startMembershipSyncJob();
  });

  // Start auto blog generation
  registry.start('auto-blog', async () => {
    // Type assertion: storage implements the methods used by autoBlogGenerator
    startAutoBlogGeneration(storage as any);
  });

  // Start Google Drive monitoring
  registry.start('google-drive', async () => {
    startGoogleDriveMonitoring();
  });

  // Start photo cleanup (runs daily at 3am)
  registry.start('photo-cleanup', async () => {
    startPhotoCleanupJob();
  });

  // Start review fetch automation (SerpAPI)
  registry.start('gmb-fetch', async () => {
    const { autoFetchGMBReviews } = await import('./server/lib/gmbAutomation');
    await autoFetchGMBReviews();
  });

  // Start review request scheduler
  const reviewRequestScheduler = getReviewRequestScheduler();
  registry.start('review-requests', async () => {
    await reviewRequestScheduler.processPendingEmails();
  });

  // Start referral nurture scheduler
  const referralNurtureScheduler = getReferralNurtureScheduler();
  registry.start('referral-nurture', async () => {
    await referralNurtureScheduler.processPendingEmails();
  });

  // Start custom campaign scheduler
  registry.start('custom-campaigns', async () => {
    const { customCampaignScheduler } = await import('./server/lib/customCampaignScheduler');
    await customCampaignScheduler.processCampaigns();
  });

  // Start referral processor
  const referralProcessor = getReferralProcessor();
  registry.start('referral-processor', async () => {
    await referralProcessor.processPendingReferrals();
  });

  // Start health alerter
  registry.start('health-alerter', async () => {
    initHealthAlerterScheduler();
  });

  // Start automated photo cleanup
  registry.start('automated-photo-cleanup', async () => {
    startAutomatedPhotoCleanup();
  });

  // Daily composite (disabled per user request)
  // registry.start('daily-composite', async () => {
  //   startDailyCompositeJob();
  // });

  // Start health check monitor
  registry.startHealthCheck();

  console.log('[Worker] ========================================');
  console.log('[Worker] All schedulers started successfully');
  console.log('[Worker] ========================================');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Worker] Received SIGTERM, shutting down gracefully...');
  registry.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] Received SIGINT, shutting down gracefully...');
  registry.stopAll();
  process.exit(0);
});

// Start the worker
initializeWorker().catch((error) => {
  console.error('[Worker] Fatal error during initialization:', error);
  process.exit(1);
});
