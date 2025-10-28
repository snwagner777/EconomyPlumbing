/**
 * Chatbot Message Feedback
 * 
 * Allows users to rate chatbot messages as positive or negative
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { chatbotMessages, chatbotConversations } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const feedbackSchema = z.object({
  messageId: z.string(),
  feedback: z.enum(['positive', 'negative']),
  conversationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: result.error.errors },
        { status: 400 }
      );
    }

    const { messageId, feedback, conversationId } = result.data;

    // Update message feedback
    await db
      .update(chatbotMessages)
      .set({ feedback })
      .where(eq(chatbotMessages.id, messageId));

    // Update conversation feedback counters
    if (conversationId) {
      const updateData = feedback === 'positive'
        ? { feedbackPositive: sql`feedback_positive + 1` }
        : { feedbackNegative: sql`feedback_negative + 1` };

      await db
        .update(chatbotConversations)
        .set(updateData)
        .where(eq(chatbotConversations.id, conversationId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Chatbot Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
