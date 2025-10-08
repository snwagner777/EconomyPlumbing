import type { InsertGoogleReview } from "@shared/schema";
import { categorizeReview } from "./reviewCategorization";

interface FacebookReviewItem {
  id?: string;
  created_time?: string;
  recommendation_type?: 'positive' | 'negative';
  rating?: number;
  review_text?: string;
  reviewer?: {
    name?: string;
    id?: string;
  };
}

interface FacebookReviewsResponse {
  data?: FacebookReviewItem[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

/**
 * Fetch Facebook page reviews using Facebook Graph API
 * Requires: Page Access Token with pages_show_list, pages_read_user_content, pages_read_engagement permissions
 */
export async function fetchFacebookReviews(
  pageId: string, 
  accessToken: string
): Promise<InsertGoogleReview[]> {
  if (!pageId || !accessToken) {
    console.error("Missing Facebook credentials (pageId or accessToken)");
    return [];
  }

  try {
    const allReviews: InsertGoogleReview[] = [];
    let nextUrl: string | null = `https://graph.facebook.com/v18.0/${pageId}/ratings?fields=created_time,recommendation_type,rating,review_text,reviewer{name,id}&limit=100&access_token=${accessToken}`;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      
      if (!response.ok) {
        console.error(`Facebook API error: ${response.status} ${response.statusText}`);
        break;
      }

      const data: FacebookReviewsResponse = await response.json();

      if (data.error) {
        console.error(`Facebook API error: ${data.error.message} (${data.error.type})`);
        break;
      }

      if (!data.data || data.data.length === 0) {
        break;
      }

      const reviews = data.data
        .filter(review => review.review_text)
        .map((review): InsertGoogleReview => {
          const categories = categorizeReview(review.review_text || '');
          const timestamp = review.created_time 
            ? Math.floor(new Date(review.created_time).getTime() / 1000)
            : Math.floor(Date.now() / 1000);
          
          // Convert Facebook rating/recommendation to 1-5 scale
          let rating = 5;
          if (review.rating !== undefined) {
            rating = review.rating;
          } else if (review.recommendation_type === 'negative') {
            rating = 2;
          } else if (review.recommendation_type === 'positive') {
            rating = 5;
          }

          const relativeTime = getRelativeTime(timestamp);

          return {
            authorName: review.reviewer?.name || 'Facebook User',
            authorUrl: review.reviewer?.id 
              ? `https://facebook.com/${review.reviewer.id}` 
              : null,
            profilePhotoUrl: null, // Facebook doesn't provide this in ratings API
            rating,
            text: review.review_text || '',
            relativeTime,
            timestamp,
            categories,
            source: 'facebook',
            reviewId: review.id || null,
          };
        });

      allReviews.push(...reviews);

      // Get next page if available
      nextUrl = data.paging?.next || null;
    }

    return allReviews;
  } catch (error) {
    console.error("Error fetching Facebook reviews:", error);
    return [];
  }
}

/**
 * Convert timestamp to relative time description
 */
function getRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

/**
 * Get a long-lived page access token from a short-lived user access token
 * This is a helper for initial setup
 */
export async function getLongLivedPageToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string,
  pageId: string
): Promise<string | null> {
  try {
    // First, exchange short-lived user token for long-lived user token
    const userTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const userTokenResponse = await fetch(userTokenUrl);
    const userTokenData = await userTokenResponse.json();

    if (!userTokenData.access_token) {
      console.error("Failed to get long-lived user token");
      return null;
    }

    // Then, get page access token (which is automatically long-lived)
    const pageTokenUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${userTokenData.access_token}`;
    const pageTokenResponse = await fetch(pageTokenUrl);
    const pageTokenData = await pageTokenResponse.json();

    return pageTokenData.access_token || null;
  } catch (error) {
    console.error("Error getting long-lived page token:", error);
    return null;
  }
}
