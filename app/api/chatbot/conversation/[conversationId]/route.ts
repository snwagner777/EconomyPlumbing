/**
 * Chatbot Conversation History
 * 
 * Fetches all messages for a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatbotMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { db } = await import('@/server/db');
  try {
    const { conversationId } = await params;

    const messages = await db
      .select()
      .from(chatbotMessages)
      .where(eq(chatbotMessages.conversationId, conversationId))
      .orderBy(chatbotMessages.createdAt);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[Chatbot Conversation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
