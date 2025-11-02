import { google } from 'googleapis';
import type { InsertGoogleReview } from "@shared/schema";
import { categorizeReview } from "./reviewCategorization";
import { storage } from "../storage";
import { GoogleMyBusinessAuth } from "./googleMyBusinessAuth";

export async function fetchGoogleMyBusinessReviews(): Promise<InsertGoogleReview[]> {
  try {
    // Get stored OAuth token
    const tokenData = await storage.getGoogleOAuthToken('google_my_business');
    
    if (!tokenData) {
      console.log('[GMB] No OAuth token found. User needs to authenticate first.');
      return [];
    }

    // Check if token is expired
    const now = new Date();
    const expiryDate = new Date(tokenData.expiryDate);
    
    const auth = GoogleMyBusinessAuth.getInstance();
    
    // Refresh token if expired
    if (expiryDate <= now && tokenData.refreshToken) {
      console.log('[GMB] Access token expired, refreshing...');
      const newTokens = await auth.refreshAccessToken(tokenData.refreshToken);
      
      if (newTokens.access_token && newTokens.expiry_date) {
        await storage.updateGoogleOAuthToken(tokenData.id, {
          accessToken: newTokens.access_token,
          expiryDate: new Date(newTokens.expiry_date),
          ...(newTokens.refresh_token && { refreshToken: newTokens.refresh_token })
        });
        
        auth.setCredentials(newTokens);
      }
    } else {
      auth.setCredentials({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expiry_date: expiryDate.getTime(),
      });
    }

    // Get account/location IDs from the token (stored during OAuth)
    const accountId = tokenData.accountId;
    const locationId = tokenData.locationId;
    
    if (!accountId || !locationId) {
      console.error('[GMB] Missing accountId or locationId in OAuth token. Please complete OAuth setup.');
      return [];
    }

    // Fetch reviews using Google My Business API v4 via REST
    const client = auth.getClient();
    const accessTokenRaw = await client.getAccessToken();
    
    // Normalize token (can be string or object with token property)
    const token = typeof accessTokenRaw === 'string' ? accessTokenRaw : accessTokenRaw?.token;
    
    if (!token) {
      throw new Error('Failed to get access token');
    }
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
    
    const reviewsResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!reviewsResponse.ok) {
      throw new Error(`GMB API error: ${reviewsResponse.status} ${reviewsResponse.statusText}`);
    }

    const data = await reviewsResponse.json();
    const reviews = data.reviews || [];
    
    console.log(`[GMB] Successfully fetched ${reviews.length} reviews (first page only)`);

    // Transform to our schema
    return reviews.map((review: any): InsertGoogleReview => {
      const reviewText = review.comment || review.reviewReply?.comment || '';
      const categories = categorizeReview(reviewText);
      
      return {
        authorName: review.reviewer?.displayName || 'Anonymous',
        authorUrl: review.reviewer?.profilePhotoUrl || null,
        profilePhotoUrl: review.reviewer?.profilePhotoUrl || null,
        rating: review.starRating === 'FIVE' ? 5 :
                review.starRating === 'FOUR' ? 4 :
                review.starRating === 'THREE' ? 3 :
                review.starRating === 'TWO' ? 2 :
                review.starRating === 'ONE' ? 1 : 5,
        text: reviewText,
        relativeTime: review.createTime ? new Date(review.createTime).toLocaleDateString() : 'Recently',
        timestamp: review.createTime ? Math.floor(new Date(review.createTime).getTime() / 1000) : Date.now() / 1000,
        categories,
      };
    });
    
  } catch (error: any) {
    console.error('[GMB] Error fetching reviews:', error.message);
    
    // If auth error, clear token so user can re-authenticate
    if (error.code === 401 || error.code === 403) {
      console.log('[GMB] Authentication error. Token may need to be refreshed.');
    }
    
    return [];
  }
}

export async function fetchAllGoogleMyBusinessReviews(): Promise<InsertGoogleReview[]> {
  let allReviews: InsertGoogleReview[] = [];
  let nextPageToken: string | undefined = undefined;

  try {
    const tokenData = await storage.getGoogleOAuthToken('google_my_business');
    
    if (!tokenData) {
      console.log('[GMB] No OAuth token available');
      return [];
    }
    
    // Get account/location IDs from the token (stored during OAuth)
    const accountId = tokenData.accountId;
    const locationId = tokenData.locationId;
    
    if (!accountId || !locationId) {
      console.log('[GMB] Missing accountId or locationId in OAuth token');
      return [];
    }

    const auth = GoogleMyBusinessAuth.getInstance();
    
    // Refresh token if needed
    const now = new Date();
    const expiryDate = new Date(tokenData.expiryDate);
    
    if (expiryDate <= now && tokenData.refreshToken) {
      const newTokens = await auth.refreshAccessToken(tokenData.refreshToken);
      
      if (newTokens.access_token && newTokens.expiry_date) {
        await storage.updateGoogleOAuthToken(tokenData.id, {
          accessToken: newTokens.access_token,
          expiryDate: new Date(newTokens.expiry_date),
          ...(newTokens.refresh_token && { refreshToken: newTokens.refresh_token })
        });
        
        auth.setCredentials(newTokens);
      }
    } else {
      auth.setCredentials({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expiry_date: expiryDate.getTime(),
      });
    }

    const client = auth.getClient();
    const accessTokenRaw = await client.getAccessToken();
    
    // Normalize token (can be string or object with token property)
    const token = typeof accessTokenRaw === 'string' ? accessTokenRaw : accessTokenRaw?.token;
    
    if (!token) {
      throw new Error('Failed to get access token');
    }
    
    // Paginate through all reviews
    do {
      const url: string = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response: Response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`GMB API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      const reviews = data.reviews || [];
      
      const transformedReviews = reviews.map((review: any): InsertGoogleReview => {
        const reviewText = review.comment || review.reviewReply?.comment || '';
        const categories = categorizeReview(reviewText);
        
        // Extract review ID from name field (format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId})
        const reviewIdMatch = review.name?.match(/reviews\/([^/]+)$/);
        const reviewId = reviewIdMatch ? reviewIdMatch[1] : null;
        
        return {
          authorName: review.reviewer?.displayName || 'Anonymous',
          authorUrl: review.reviewer?.profilePhotoUrl || null,
          profilePhotoUrl: review.reviewer?.profilePhotoUrl || null,
          rating: review.starRating === 'FIVE' ? 5 :
                  review.starRating === 'FOUR' ? 4 :
                  review.starRating === 'THREE' ? 3 :
                  review.starRating === 'TWO' ? 2 :
                  review.starRating === 'ONE' ? 1 : 5,
          text: reviewText,
          relativeTime: review.createTime ? new Date(review.createTime).toLocaleDateString() : 'Recently',
          timestamp: review.createTime ? Math.floor(new Date(review.createTime).getTime() / 1000) : Date.now() / 1000,
          categories,
          source: 'gmb_api',
          reviewId,
        };
      });

      allReviews = [...allReviews, ...transformedReviews];
      nextPageToken = data.nextPageToken;
      
      console.log(`[GMB] Fetched ${reviews.length} reviews (Total: ${allReviews.length})`);
      
    } while (nextPageToken);

    console.log(`[GMB] Successfully fetched all ${allReviews.length} reviews`);
    return allReviews;
    
  } catch (error: any) {
    console.error('[GMB] Error fetching all reviews:', error.message);
    return allReviews; // Return what we have so far
  }
}

