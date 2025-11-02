import { db } from "../db";
import { googleReviews } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const SERPAPI_BASE_URL = "https://serpapi.com/search";

interface SerpApiParams {
  api_key: string;
  engine: string;
  [key: string]: string | number | boolean;
}

/**
 * Fetch Google Business reviews using SerpAPI with pagination to get all reviews
 */
export async function fetchGoogleReviewsViaSerpApi(
  placeId: string = "ChIJzwKq2Qu1RIYRRa82s95GBMQ" // Economy Plumbing Services, LLC - Google Place ID
): Promise<{ success: boolean; newReviews: number; error?: string }> {
  if (!SERPAPI_KEY) {
    return { success: false, newReviews: 0, error: "SERPAPI_API_KEY not configured" };
  }

  try {
    console.log("[SerpAPI] Fetching Google reviews with pagination...");

    let newReviewCount = 0;
    let nextPageToken: string | null = null;
    let pageCount = 0;
    const maxPages = 100; // Safety limit (100 pages × ~8 reviews = ~800 reviews)

    do {
      const params: SerpApiParams = {
        api_key: SERPAPI_KEY,
        engine: "google_maps_reviews",
        place_id: placeId,
        hl: "en",
      };

      // Add pagination token if we have one
      if (nextPageToken) {
        params.next_page_token = nextPageToken;
        params.num = 20; // Max 20 results per page (only works with next_page_token)
      }

      const url = new URL(SERPAPI_BASE_URL);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SerpAPI] Google reviews fetch failed:", errorText);
        return { 
          success: false, 
          newReviews: newReviewCount, 
          error: `SerpAPI error: ${response.status} ${errorText}` 
        };
      }

      const data = await response.json();
      
      if (!data.reviews || !Array.isArray(data.reviews)) {
        console.log("[SerpAPI] No more reviews found");
        break;
      }

      pageCount++;
      console.log(`[SerpAPI] Page ${pageCount}: Processing ${data.reviews.length} reviews...`);

      // Process each review
      for (const review of data.reviews) {
        const reviewId = review.review_id || `google_${review.user?.name}_${review.iso_date}`;
        
        // Parse timestamp
        let timestamp: number;
        if (review.iso_date) {
          timestamp = Math.floor(new Date(review.iso_date).getTime() / 1000);
        } else {
          timestamp = Math.floor(Date.now() / 1000);
        }

        // Check if review already exists
        const existing = await db
          .select()
          .from(googleReviews)
          .where(
            and(
              eq(googleReviews.reviewId, reviewId),
              eq(googleReviews.source, "google_serpapi")
            )
          )
          .limit(1);

        if (existing.length > 0) {
          continue; // Skip duplicates
        }

        // Insert new review
        await db.insert(googleReviews).values({
          authorName: review.user?.name || "Anonymous",
          authorUrl: review.user?.link || null,
          profilePhotoUrl: review.user?.thumbnail || null,
          rating: review.rating || 5,
          text: review.snippet || "",
          relativeTime: review.date || "recently",
          timestamp,
          reviewId,
          source: "google_serpapi",
          canReply: false, // SerpAPI is read-only, no reply capability
          categories: [],
        });

        newReviewCount++;
      }

      // Check for next page
      nextPageToken = data.serpapi_pagination?.next_page_token || null;

      // Small delay between requests to be respectful
      if (nextPageToken && pageCount < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } while (nextPageToken && pageCount < maxPages);

    console.log(`[SerpAPI] Imported ${newReviewCount} new Google reviews across ${pageCount} pages`);
    return { success: true, newReviews: newReviewCount };

  } catch (error: any) {
    console.error("[SerpAPI] Error fetching Google reviews:", error);
    return { 
      success: false, 
      newReviews: 0, 
      error: error.message 
    };
  }
}

/**
 * Fetch Yelp reviews using SerpAPI with pagination
 */
export async function fetchYelpReviewsViaSerpApi(
  placeId: string = "RYWwjO6p1wk2w6E0BSmhsg" // Economy Plumbing Services - Yelp place_id
): Promise<{ success: boolean; newReviews: number; error?: string }> {

  if (!SERPAPI_KEY) {
    return { success: false, newReviews: 0, error: "SERPAPI_API_KEY not configured" };
  }

  try {
    console.log("[SerpAPI] Fetching Yelp reviews with pagination...");

    let newReviewCount = 0;
    let start = 0;
    const num = 49; // Max 49 results per page
    const maxPages = 10; // Safety limit (10 pages × 49 reviews = ~490 reviews)
    let pageCount = 0;

    while (pageCount < maxPages) {
      const params: SerpApiParams = {
        api_key: SERPAPI_KEY,
        engine: "yelp_reviews",
        place_id: placeId,
        num,
        start,
      };

      const url = new URL(SERPAPI_BASE_URL);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[SerpAPI] Yelp reviews fetch failed:", errorText);
        return { 
          success: false, 
          newReviews: newReviewCount, 
          error: `SerpAPI error: ${response.status} ${errorText}` 
        };
      }

      const data = await response.json();
      
      if (!data.reviews || !Array.isArray(data.reviews) || data.reviews.length === 0) {
        console.log("[SerpAPI] No more Yelp reviews found");
        break;
      }

      pageCount++;
      console.log(`[SerpAPI] Yelp Page ${pageCount}: Processing ${data.reviews.length} reviews...`);

      // Process each review
      for (const review of data.reviews) {
        const reviewId = review.review_id || `yelp_${review.user?.name}_${review.date}`;
        
        // Check if review already exists
        const existing = await db
          .select()
          .from(googleReviews)
          .where(
            and(
              eq(googleReviews.reviewId, reviewId),
              eq(googleReviews.source, "yelp")
            )
          )
          .limit(1);

        if (existing.length > 0) {
          continue;
        }

        // Parse timestamp
        let timestamp: number;
        if (review.date) {
          timestamp = Math.floor(new Date(review.date).getTime() / 1000);
        } else {
          timestamp = Math.floor(Date.now() / 1000);
        }

        // Insert new review
        await db.insert(googleReviews).values({
          authorName: review.user?.name || "Anonymous",
          authorUrl: review.user?.link || null,
          profilePhotoUrl: review.user?.thumbnail || null,
          rating: review.rating || 5,
          text: review.comment || review.text || "",
          relativeTime: review.date || "recently",
          timestamp,
          reviewId,
          source: "yelp",
          canReply: false,
          categories: [],
        });

        newReviewCount++;
      }

      // Move to next page
      start += num;

      // Small delay between requests
      if (pageCount < maxPages && data.reviews.length === num) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        break; // No more pages
      }
    }

    console.log(`[SerpAPI] Imported ${newReviewCount} new Yelp reviews across ${pageCount} pages`);
    return { success: true, newReviews: newReviewCount };

  } catch (error: any) {
    console.error("[SerpAPI] Error fetching Yelp reviews:", error);
    return { 
      success: false, 
      newReviews: 0, 
      error: error.message 
    };
  }
}

/**
 * Fetch Facebook reviews using Facebook Profile API
 * NOTE: Facebook doesn't provide reviews via this API - disabled
 */
export async function fetchFacebookReviewsViaSerpApi(): Promise<{ success: boolean; newReviews: number; error?: string }> {
  console.log("[SerpAPI] Facebook reviews not available via SerpAPI (Facebook Profile API doesn't include reviews)");
  return { success: true, newReviews: 0 };
}

/**
 * Fetch all reviews from all sources
 */
export async function fetchAllReviewsViaSerpApi(): Promise<{
  success: boolean;
  google: number;
  yelp: number;
  facebook: number;
  errors: string[];
}> {
  console.log("[SerpAPI] Starting review sync for all platforms...");

  const results = await Promise.all([
    fetchGoogleReviewsViaSerpApi(),
    fetchYelpReviewsViaSerpApi(),
    fetchFacebookReviewsViaSerpApi(),
  ]);

  const [googleResult, yelpResult, facebookResult] = results;

  const errors: string[] = [];
  if (googleResult.error) errors.push(`Google: ${googleResult.error}`);
  if (yelpResult.error) errors.push(`Yelp: ${yelpResult.error}`);
  if (facebookResult.error) errors.push(`Facebook: ${facebookResult.error}`);

  const totalReviews = 
    googleResult.newReviews + 
    yelpResult.newReviews + 
    facebookResult.newReviews;

  console.log(
    `[SerpAPI] Review sync complete: ${totalReviews} new reviews ` +
    `(Google: ${googleResult.newReviews}, Yelp: ${yelpResult.newReviews}, Facebook: ${facebookResult.newReviews})`
  );

  return {
    success: errors.length === 0,
    google: googleResult.newReviews,
    yelp: yelpResult.newReviews,
    facebook: facebookResult.newReviews,
    errors,
  };
}
