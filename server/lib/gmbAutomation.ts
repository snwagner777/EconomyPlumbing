import { postReplyToGoogleReview } from "./googleMyBusinessReviews";
import { fetchAllReviewsViaSerpApi } from "./serpApiReviews";
import { db } from "../db";
import { googleReviews } from "@shared/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Automatically fetch reviews from Google, Yelp, and Facebook via SerpAPI
 * Clears old SerpAPI reviews first to ensure fresh, complete data
 * Preserves GMB API reviews (which have reply capability)
 * Runs on a schedule (every 6 hours)
 */
export async function autoFetchGMBReviews(): Promise<void> {
  try {
    console.log('[Review Automation] Starting automatic review sync...');
    
    // Clear only SerpAPI-sourced reviews (preserve GMB API reviews with replies)
    console.log('[Review Automation] Clearing old SerpAPI reviews...');
    await db.delete(googleReviews).where(
      or(
        eq(googleReviews.source, 'google_serpapi'),
        eq(googleReviews.source, 'yelp'),
        eq(googleReviews.source, 'facebook')
      )
    );
    console.log('[Review Automation] Old SerpAPI reviews cleared (GMB API reviews preserved)');
    
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
 * Automatically generate and post AI replies to unreplied GMB reviews
 * Only replies to reviews from gmb_api source (with valid reviewId)
 */
export async function autoReplyToGMBReviews(): Promise<void> {
  try {
    console.log('[GMB Automation] Starting automatic reply generation...');
    
    // Get unreplied GMB reviews (source = 'gmb_api' and replyText is null)
    const unrepliedReviews = await db
      .select()
      .from(googleReviews)
      .where(
        and(
          eq(googleReviews.source, 'gmb_api'),
          isNull(googleReviews.replyText)
        )
      )
      .limit(10); // Process 10 at a time to avoid rate limits
    
    if (unrepliedReviews.length === 0) {
      console.log('[GMB Automation] No unreplied reviews found');
      return;
    }

    console.log(`[GMB Automation] Found ${unrepliedReviews.length} unreplied reviews`);

    for (const review of unrepliedReviews) {
      if (!review.reviewId) {
        console.log(`[GMB Automation] Skipping review ${review.id} - missing reviewId`);
        continue;
      }

      try {
        // Generate AI reply
        const aiReply = await generateAIReply(review);
        
        if (!aiReply) {
          console.log(`[GMB Automation] Failed to generate reply for review ${review.id}`);
          continue;
        }

        // Post reply to Google
        const posted = await postReplyToGoogleReview(review.reviewId, aiReply);
        
        if (posted) {
          // Update database with reply
          await db
            .update(googleReviews)
            .set({
              replyText: aiReply,
              repliedAt: new Date(),
            })
            .where(eq(googleReviews.id, review.id));
          
          console.log(`[GMB Automation] Successfully posted reply to review ${review.id}`);
        } else {
          console.log(`[GMB Automation] Failed to post reply to review ${review.id}`);
        }
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`[GMB Automation] Error replying to review ${review.id}:`, error.message);
      }
    }
    
    console.log('[GMB Automation] Auto-reply process complete');
  } catch (error: any) {
    console.error('[GMB Automation] Error in auto-reply:', error.message);
  }
}

/**
 * Generate AI-powered reply for a Google review
 */
async function generateAIReply(review: any): Promise<string | null> {
  try {
    const businessName = "Economy Plumbing";
    const reviewerName = review.authorName || "Customer";
    const rating = review.rating;
    const reviewText = review.text || "";

    const prompt = rating >= 4
      ? `You are the owner of ${businessName}, a professional plumbing company. Write a warm, professional response to this ${rating}-star Google review from ${reviewerName}. 
      
Review: "${reviewText}"

Guidelines:
- Thank them personally and mention specific details from their review
- Keep it under 100 words
- Be authentic and conversational (not overly formal)
- If they mentioned a technician, acknowledge that person
- Invite them to reach out anytime
- Sign off as "The ${businessName} Team"

Write the reply:`
      : `You are the owner of ${businessName}, a professional plumbing company. Write a sincere, professional response to this ${rating}-star Google review from ${reviewerName}.

Review: "${reviewText}"

Guidelines:
- Apologize sincerely and acknowledge their concerns
- Keep it under 100 words
- Take responsibility without making excuses
- Offer to make things right (provide contact info)
- Be empathetic and solution-focused
- Sign off as "The ${businessName} Team"

Write the reply:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional business owner writing authentic, personalized responses to Google reviews. Write naturally and conversationally.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    return reply || null;
  } catch (error: any) {
    console.error('[GMB Automation] Error generating AI reply:', error.message);
    return null;
  }
}

/**
 * Start the automation schedulers
 */
export function startGMBAutomation(): void {
  console.log('[GMB Automation] Starting schedulers...');
  
  // Fetch reviews every 6 hours
  const FETCH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  setInterval(autoFetchGMBReviews, FETCH_INTERVAL);
  
  // Auto-reply every 15 minutes (checks for new unreplied reviews)
  const REPLY_INTERVAL = 15 * 60 * 1000; // 15 minutes
  setInterval(autoReplyToGMBReviews, REPLY_INTERVAL);
  
  // Run immediately on startup
  setTimeout(autoFetchGMBReviews, 5000); // Wait 5 seconds after startup
  setTimeout(autoReplyToGMBReviews, 10000); // Wait 10 seconds after startup
  
  console.log('[GMB Automation] Schedulers started:');
  console.log(`  - Review fetch: every ${FETCH_INTERVAL / 1000 / 60 / 60} hours`);
  console.log(`  - Auto-reply: every ${REPLY_INTERVAL / 1000 / 60} minutes`);
}
