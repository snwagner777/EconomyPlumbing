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

    if (!tokenData.accountId || !tokenData.locationId) {
      console.error('[GMB] Missing account ID or location ID in stored token');
      return [];
    }

    // Fetch reviews using Google My Business API v4 via REST
    const client = auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }
    
    // Remove 'accounts/' and 'locations/' prefixes if they exist (stored with prefixes)
    const accountId = tokenData.accountId.replace('accounts/', '');
    const locationId = tokenData.locationId.replace('locations/', '');
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
    
    const reviewsResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
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
    
    if (!tokenData || !tokenData.accountId || !tokenData.locationId) {
      console.log('[GMB] No OAuth credentials available');
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
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    // Remove 'accounts/' and 'locations/' prefixes if they exist (stored with prefixes)
    const accountId = tokenData.accountId.replace('accounts/', '');
    const locationId = tokenData.locationId.replace('locations/', '');
    
    // Paginate through all reviews
    do {
      const url: string = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response: Response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
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
