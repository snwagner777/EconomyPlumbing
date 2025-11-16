import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { db } from '@/server/db';
import { googleReviews } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const requestSchema = z.object({
  type: z.enum(['google', 'custom']),
  replyText: z.string().min(1, "Reply text is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { replyText, type } = requestSchema.parse(body);
    
    // Save reply to database and post to external platform
    let result: any;
    if (type === 'custom') {
      result = await storage.replyToReview(id, replyText);
      if (!result) {
        return NextResponse.json(
          { message: "Review not found" },
          { status: 404 }
        );
      }
    } else {
      // Get the review to check its source and external reviewId
      const [review] = await db
        .select()
        .from(googleReviews)
        .where(eq(googleReviews.id, id))
        .limit(1);
      
      if (!review) {
        return NextResponse.json(
          { message: "Review not found" },
          { status: 404 }
        );
      }
      
      // NOTE: Google My Business reply posting has been removed
      // Reviews are saved to database only
      let postedToGoogle = false;
      const isGoogleReview = review.source === 'gmb_api';
      
      if (isGoogleReview && review.reviewId) {
        console.log(`[Review Reply] Google My Business integration removed - saving reply to database only for review ${id}`);
      }
      
      // Update database with reply
      const [updated] = await db
        .update(googleReviews)
        .set({
          replyText: replyText.trim(),
          repliedAt: new Date(),
        })
        .where(eq(googleReviews.id, id))
        .returning();
      
      result = updated;
      
      // Inform user if Google posting failed
      if (isGoogleReview && review.reviewId && !postedToGoogle) {
        return NextResponse.json({ 
          success: true, 
          message: "Reply saved to database, but failed to post to Google. Please check your Google Business Profile connection.",
          postedToGoogle: false
        });
      }
    }
    
    console.log(`[Review Reply] Reply posted for review ${id}`);
    return NextResponse.json({ 
      success: true, 
      message: "Reply posted successfully", 
      postedToGoogle: type === 'google' 
    });
  } catch (error: any) {
    console.error('[Review Reply] Post reply error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { message: error.errors[0]?.message || "Invalid request data" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Error posting reply: " + error.message },
      { status: 500 }
    );
  }
}
