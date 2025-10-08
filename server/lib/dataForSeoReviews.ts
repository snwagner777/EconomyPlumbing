import type { InsertGoogleReview } from "@shared/schema";
import { categorizeReview } from "./reviewCategorization";

interface DataForSeoReviewItem {
  author?: {
    name?: string;
    url?: string;
    photo_url?: string;
  };
  rating?: {
    value?: number;
  };
  review_text?: string;
  timestamp?: string;
  time_ago?: string;
  review_id?: string;
}

interface DataForSeoResponse {
  status_code?: number;
  status_message?: string;
  tasks?: Array<{
    status_code?: number;
    status_message?: string;
    result?: Array<{
      items?: DataForSeoReviewItem[];
    }>;
  }>;
}

/**
 * Fetch all Google reviews using DataForSEO Reviews API
 * Cost: ~$0.00075 per 10 reviews using place_id
 */
export async function fetchDataForSeoReviews(placeId: string): Promise<InsertGoogleReview[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("Missing DataForSEO credentials");
    return [];
  }

  if (!placeId) {
    console.error("Missing Google Place ID for DataForSEO");
    return [];
  }

  try {
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    
    // Use the LIVE endpoint for immediate synchronous results
    const response = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        place_id: placeId,
        location_code: 2840, // United States
        language_code: 'en',
        depth: 500, // Fetch up to 500 reviews
        sort_by: 'newest' // Get newest first
      }])
    });

    if (!response.ok) {
      console.error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: DataForSeoResponse = await response.json();

    if (!data.tasks || data.tasks.length === 0) {
      console.log("No tasks returned from DataForSEO");
      return [];
    }

    const task = data.tasks[0];
    if (task.status_code !== 20000) {
      console.error(`DataForSEO error: ${task.status_message} (code: ${task.status_code})`);
      return [];
    }

    const items = task.result?.[0]?.items || [];
    
    return items
      .filter(review => review.review_text && review.rating?.value)
      .map((review): InsertGoogleReview => {
        const categories = categorizeReview(review.review_text || '');
        const timestamp = review.timestamp 
          ? Math.floor(new Date(review.timestamp).getTime() / 1000)
          : Math.floor(Date.now() / 1000);

        return {
          authorName: review.author?.name || 'Anonymous',
          authorUrl: review.author?.url || null,
          profilePhotoUrl: review.author?.photo_url || null,
          rating: review.rating?.value || 5,
          text: review.review_text || '',
          relativeTime: review.time_ago || 'recently',
          timestamp,
          categories,
          source: 'dataforseo',
          reviewId: review.review_id || null,
        };
      });
  } catch (error) {
    console.error("Error fetching DataForSEO reviews:", error);
    return [];
  }
}

/**
 * Fetch Google reviews using the "live" endpoint for immediate results
 * Cost: Higher priority, faster response (up to 1 minute)
 */
export async function fetchDataForSeoReviewsLive(placeId: string): Promise<InsertGoogleReview[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("Missing DataForSEO credentials");
    return [];
  }

  if (!placeId) {
    console.error("Missing Google Place ID for DataForSEO");
    return [];
  }

  try {
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    
    const response = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/task_get', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: DataForSeoResponse = await response.json();

    if (!data.tasks || data.tasks.length === 0) {
      return [];
    }

    const allReviews: InsertGoogleReview[] = [];

    for (const task of data.tasks) {
      if (task.status_code !== 20000) continue;
      
      const items = task.result?.[0]?.items || [];
      
      const reviews = items
        .filter(review => review.review_text && review.rating?.value)
        .map((review): InsertGoogleReview => {
          const categories = categorizeReview(review.review_text || '');
          const timestamp = review.timestamp 
            ? Math.floor(new Date(review.timestamp).getTime() / 1000)
            : Math.floor(Date.now() / 1000);

          return {
            authorName: review.author?.name || 'Anonymous',
            authorUrl: review.author?.url || null,
            profilePhotoUrl: review.author?.photo_url || null,
            rating: review.rating?.value || 5,
            text: review.review_text || '',
            relativeTime: review.time_ago || 'recently',
            timestamp,
            categories,
            source: 'dataforseo',
            reviewId: review.review_id || null,
          };
        });

      allReviews.push(...reviews);
    }

    return allReviews;
  } catch (error) {
    console.error("Error fetching DataForSEO reviews:", error);
    return [];
  }
}
