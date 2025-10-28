/**
 * Private Feedback API
 * 
 * Handles negative feedback privately (not displayed publicly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const privateFeedbackSchema = z.object({
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = privateFeedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Missing required fields', details: result.error.errors },
        { status: 400 }
      );
    }

    const { customerId, customerName, customerEmail, rating, feedback } = result.data;

    // Log the private feedback (could extend to save to database if needed)
    console.log('[Private Feedback] Received:', {
      customerId,
      customerName,
      customerEmail,
      rating,
      feedback,
      timestamp: new Date().toISOString()
    });

    // TODO: Send email notification to admin
    // TODO: Create follow-up task in CRM

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback. We'll review it and work to improve."
    });

  } catch (error: any) {
    console.error('[Private Feedback API] Error:', error);
    return NextResponse.json(
      { message: 'Error submitting feedback: ' + error.message },
      { status: 500 }
    );
  }
}
