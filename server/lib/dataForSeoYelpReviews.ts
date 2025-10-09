import type { InsertGoogleReview } from "@shared/schema";
import { categorizeReview } from "./reviewCategorization";

interface YelpReviewItem {
  review_text?: string;
  rating?: {
    rating_type?: string;
    value?: number;
    rating_max?: number;
  };
  timestamp?: string;
  profile_name?: string;
  profile_url?: string;
  profile_image_url?: string;
  owner_answer?: string;
  owner_time_ago?: string;
  time_ago?: string;
  review_id?: string;
}

interface YelpTask {
  id?: string;
  status_code?: number;
  status_message?: string;
  result?: Array<{
    items?: YelpReviewItem[];
  }>;
}

interface YelpResponse {
  status_code?: number;
  status_message?: string;
  tasks?: YelpTask[];
}

/**
 * Fetch all Yelp reviews using DataForSEO Yelp Reviews API
 * 
 * Smart async approach:
 * 1. Check for completed tasks from previous runs
 * 2. Queue a new task for the next refresh cycle
 * 
 * Cost: Charged per 10 reviews from DataForSEO
 */
export async function fetchDataForSeoYelpReviews(yelpAlias: string): Promise<InsertGoogleReview[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.error("[Yelp] Missing DataForSEO credentials");
    return [];
  }

  if (!yelpAlias) {
    console.error("[Yelp] Missing Yelp business alias for DataForSEO");
    return [];
  }

  try {
    const credentials = Buffer.from(`${login}:${password}`).toString('base64');
    let items: YelpReviewItem[] = [];
    
    // Step 1: Check for any completed Yelp tasks from previous runs
    const readyResponse = await fetch('https://api.dataforseo.com/v3/business_data/yelp/reviews/tasks_ready', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (readyResponse.ok) {
      const readyData: YelpResponse = await readyResponse.json();
      const readyTasks = readyData.tasks || [];
      
      if (readyTasks.length > 0 && readyTasks[0].result && readyTasks[0].result.length > 0) {
        // Get results from the most recent completed task
        const taskResult = readyTasks[0].result[0];
        const readyTaskId = (taskResult as any).id;
        console.log(`[Yelp] Found completed DataForSEO task: ${readyTaskId}`);
        
        const getResponse = await fetch(`https://api.dataforseo.com/v3/business_data/yelp/reviews/task_get/${readyTaskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (getResponse.ok) {
          const getData: YelpResponse = await getResponse.json();
          const getTask = getData.tasks?.[0];
          
          console.log(`[Yelp] DataForSEO task status: ${getTask?.status_code}, message: ${getTask?.status_message}`);
          
          if (getTask?.status_code === 20000) {
            items = getTask.result?.[0]?.items || [];
            console.log(`[Yelp] DataForSEO returned ${items.length} reviews from completed task`);
          } else {
            console.error(`[Yelp] DataForSEO task failed with status ${getTask?.status_code}: ${getTask?.status_message}`);
          }
        }
      } else {
        console.log("[Yelp] No completed DataForSEO tasks found");
      }
    }
    
    // Step 2: Queue a new task for the next refresh cycle
    const postResponse = await fetch('https://api.dataforseo.com/v3/business_data/yelp/reviews/task_post', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        alias: yelpAlias,
        language_name: 'English',
        depth: 150, // Fetch up to 150 reviews (charged per 10)
        sort_by: 'highest_rating', // Get highest rated reviews first
        priority: 2 // High priority for faster processing
      }])
    });

    if (postResponse.ok) {
      const postData: YelpResponse = await postResponse.json();
      const taskId = postData.tasks?.[0]?.id;
      if (taskId) {
        console.log(`[Yelp] Queued new DataForSEO task: ${taskId} (will be ready for next refresh)`);
      }
    }
    
    // Return results from completed task (if any)
    return items
      .filter(review => review.review_text && review.rating?.value)
      .map((review): InsertGoogleReview => {
        const categories = categorizeReview(review.review_text || '');
        
        // Parse timestamp - Yelp returns format like "2023-10-15 14:23:07 +00:00"
        let timestamp = Math.floor(Date.now() / 1000);
        if (review.timestamp) {
          try {
            timestamp = Math.floor(new Date(review.timestamp).getTime() / 1000);
          } catch (e) {
            console.error('[Yelp] Error parsing timestamp:', review.timestamp);
          }
        }

        return {
          authorName: review.profile_name || 'Anonymous',
          authorUrl: review.profile_url || null,
          profilePhotoUrl: review.profile_image_url || null,
          rating: review.rating?.value || 5,
          text: review.review_text || '',
          relativeTime: review.time_ago || 'recently',
          timestamp,
          categories,
          source: 'yelp',
          reviewId: review.review_id || null,
        };
      });
  } catch (error) {
    console.error("[Yelp] Error fetching DataForSEO Yelp reviews:", error);
    return [];
  }
}
