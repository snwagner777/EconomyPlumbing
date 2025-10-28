/**
 * Public API - Review Feedback Submission
 * 
 * Handle customer review submissions from public review request form
 * 
 * TODO: For email campaign token-based reviews, create separate endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { contactSubmissions } from '@shared/schema';
import { z } from 'zod';

const feedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(10, 'Review must be at least 10 characters'),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour
    });
    return true;
  }

  if (limit.count >= 5) {
    return false; // Max 5 reviews per hour
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Store review request in contact submissions
    // TODO: Create dedicated review submissions table
    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        name: result.data.name,
        email: result.data.email,
        phone: '', // Not collected on this form
        service: 'review_request',
        message: `Rating: ${result.data.rating}/5 stars\n\n${result.data.review}`,
        pageContext: '/review-request',
      })
      .returning();

    // TODO: If rating >= 4, send follow-up asking to post on Google/Facebook
    // TODO: If rating < 4, create internal task for follow-up

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      submissionId: submission.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[Review Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
