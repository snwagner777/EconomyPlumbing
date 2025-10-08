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

interface DataForSeoTask {
  id?: string;
  status_code?: number;
  status_message?: string;
  result?: Array<{
    items?: DataForSeoReviewItem[];
  }>;
}

interface DataForSeoResponse {
  status_code?: number;
  status_message?: string;
  tasks?: DataForSeoTask[];
}

/**
 * Fetch all Google reviews using DataForSEO Reviews API
 * 
 * Smart async approach:
 * 1. Check for completed tasks from previous runs
 * 2. Queue a new task for the next refresh cycle
 * 
 * Cost: ~$0.00075 per 20 reviews using place_id
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
    let items: DataForSeoReviewItem[] = [];
    
    // Step 1: Check for any completed tasks from previous runs
    const readyResponse = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/tasks_ready', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (readyResponse.ok) {
      const readyData: DataForSeoResponse = await readyResponse.json();
      const readyTasks = readyData.tasks || [];
      
      if (readyTasks.length > 0 && readyTasks[0].result && readyTasks[0].result.length > 0) {
        // Get results from the most recent completed task
        // Note: tasks_ready returns tasks[0].result[0].id, not tasks[0].id
        const taskResult = readyTasks[0].result[0];
        const readyTaskId = (taskResult as any).id;
        console.log(`Found completed DataForSEO task: ${readyTaskId}`);
        
        const getResponse = await fetch(`https://api.dataforseo.com/v3/business_data/google/reviews/task_get/${readyTaskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (getResponse.ok) {
          const getData: DataForSeoResponse = await getResponse.json();
          const getTask = getData.tasks?.[0];
          
          console.log(`DataForSEO task status: ${getTask?.status_code}, message: ${getTask?.status_message}`);
          
          if (getTask?.status_code === 20000) {
            items = getTask.result?.[0]?.items || [];
            console.log(`DataForSEO returned ${items.length} reviews from completed task`);
          } else {
            console.error(`DataForSEO task failed with status ${getTask?.status_code}: ${getTask?.status_message}`);
          }
        }
      } else {
        console.log("No completed DataForSEO tasks found");
      }
    }
    
    // Step 2: Queue a new task for the next refresh cycle (24 hours from now)
    const postResponse = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/task_post', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        place_id: placeId,
        location_code: 2840, // United States
        language_code: 'en',
        depth: 500, // Fetch up to 500 reviews (charged per 20)
        sort_by: 'newest', // Get newest first
        priority: 2 // High priority for faster processing (~1 minute)
      }])
    });

    if (postResponse.ok) {
      const postData: DataForSeoResponse = await postResponse.json();
      const taskId = postData.tasks?.[0]?.id;
      if (taskId) {
        console.log(`Queued new DataForSEO task: ${taskId} (will be ready for next refresh)`);
      }
    }
    
    // Return results from completed task (if any)
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
