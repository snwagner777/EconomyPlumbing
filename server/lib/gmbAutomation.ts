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
    
    // Clear old SerpAPI-sourced reviews
    console.log('[Review Automation] Clearing old SerpAPI reviews...');
    await db.delete(googleReviews).where(
      or(
        eq(googleReviews.source, 'google_serpapi'),
        eq(googleReviews.source, 'yelp'),
        eq(googleReviews.source, 'facebook')
      )
    );
    console.log('[Review Automation] Old SerpAPI reviews cleared');
    
    // Fetch fresh reviews from all platforms
    const results = await fetchAllReviewsViaSerpApi();
    
    const totalReviews = results.google + results.yelp + results.facebook;
    
    if (totalReviews === 0) {
      console.log('[Review Automation] No reviews found');
    } else {
      console.log(
        `[Review Automation] Synced ${totalReviews} fresh reviews ` +
        `(Google: ${results.google}, Yelp: ${results.yelp}, Facebook: ${results.facebook})`
      );
    }
    
    if (results.errors.length > 0) {
      console.warn('[Review Automation] Errors during fetch:', results.errors);
    }
  } catch (error: any) {
    console.error('[Review Automation] Error in auto-fetch:', error.message);
  }
}


/**
 * Start the review fetch scheduler
 */
export function startGMBAutomation(): void {
  console.log('[Review Automation] Starting scheduler...');
  
  // Fetch reviews every 6 hours
  const FETCH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  setInterval(autoFetchGMBReviews, FETCH_INTERVAL);
  
  // Run immediately on startup
  setTimeout(autoFetchGMBReviews, 5000); // Wait 5 seconds after startup
  
  console.log('[Review Automation] Scheduler started:');
  console.log(`  - Review fetch: every ${FETCH_INTERVAL / 1000 / 60 / 60} hours`);
}
