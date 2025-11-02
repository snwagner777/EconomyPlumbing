import { fetchAllReviewsViaSerpApi } from "./serpApiReviews";
import { db } from "../db";
import { googleReviews } from "@shared/schema";
import { or, eq } from "drizzle-orm";

/**
 * Automatically fetch reviews from Google, Yelp, and Facebook via SerpAPI
 * Clears old SerpAPI reviews first to ensure fresh, complete data
 * Runs on a schedule (every 6 hours)
 */
export async function autoFetchGMBReviews(): Promise<void> {
  try {
    console.log('[Review Automation] Starting automatic review sync...');
    
    // Fetch fresh reviews from all platforms FIRST
    const results = await fetchAllReviewsViaSerpApi();
    
    const totalReviews = results.google + results.yelp + results.facebook;
    
    // Only clear old reviews if we successfully fetched new ones
    if (totalReviews > 0) {
      console.log('[Review Automation] Clearing old SerpAPI reviews before replacing...');
      await db.delete(googleReviews).where(
        or(
          eq(googleReviews.source, 'google_serpapi'),
          eq(googleReviews.source, 'yelp'),
          eq(googleReviews.source, 'facebook')
        )
      );
      
      console.log(
        `[Review Automation] Synced ${totalReviews} fresh reviews ` +
        `(Google: ${results.google}, Yelp: ${results.yelp}, Facebook: ${results.facebook})`
      );
    } else {
      console.log('[Review Automation] No new reviews fetched - keeping existing reviews in database');
    }
    
    if (results.errors.length > 0) {
      console.warn('[Review Automation] Errors during fetch:', results.errors);
      console.warn('[Review Automation] Preserving existing reviews due to fetch errors');
    }
  } catch (error: any) {
    console.error('[Review Automation] Error in auto-fetch:', error.message);
    console.error('[Review Automation] Preserving existing reviews due to error');
  }
}


/**
 * Start the review fetch scheduler
 */
export function startGMBAutomation(): void {
  console.log('[Review Automation] Starting scheduler...');
  
  // Fetch reviews once per day
  const FETCH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours (daily)
  setInterval(autoFetchGMBReviews, FETCH_INTERVAL);
  
  // Run immediately on startup
  setTimeout(autoFetchGMBReviews, 5000); // Wait 5 seconds after startup
  
  console.log('[Review Automation] Scheduler started:');
  console.log(`  - Review fetch: every ${FETCH_INTERVAL / 1000 / 60 / 60} hours (daily)`);
}
