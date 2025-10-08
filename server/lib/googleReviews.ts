import type { InsertGoogleReview } from "@shared/schema";

interface GooglePlacesReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  text: string;
  relative_time_description: string;
  time: number;
}

interface GooglePlacesResponse {
  result?: {
    reviews?: GooglePlacesReview[];
    rating?: number;
    user_ratings_total?: number;
  };
  status: string;
  error_message?: string;
}

export async function fetchGoogleReviews(): Promise<InsertGoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error("Missing Google Places API credentials");
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places API error:", data.status, data.error_message);
      return [];
    }

    if (!data.result?.reviews) {
      console.log("No reviews found for place");
      return [];
    }

    return data.result.reviews.map((review): InsertGoogleReview => ({
      authorName: review.author_name,
      authorUrl: review.author_url || null,
      profilePhotoUrl: review.profile_photo_url || null,
      rating: review.rating,
      text: review.text,
      relativeTime: review.relative_time_description,
      timestamp: review.time,
    }));
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return [];
  }
}

export function filterReviewsByKeywords(
  reviews: InsertGoogleReview[], 
  keywords: string[]
): InsertGoogleReview[] {
  if (keywords.length === 0) return reviews;
  
  return reviews.filter(review => {
    const reviewText = review.text.toLowerCase();
    return keywords.some(keyword => reviewText.includes(keyword.toLowerCase()));
  });
}

export function getHighRatedReviews(
  reviews: InsertGoogleReview[], 
  minRating: number = 4
): InsertGoogleReview[] {
  return reviews.filter(review => review.rating >= minRating);
}
