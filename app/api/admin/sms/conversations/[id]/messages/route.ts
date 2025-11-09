/**
 * Admin API - Conversation Message History
 * 
 * GET: Fetch all messages in a conversation (thread view)
 * POST: Send reply in conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getSession } from '@/lib/session';
import { db } from '@/server/db';
import { smsMessageEvents, smsConversations } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { sendSMS } from '@/server/lib/sms';
import { z } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = parseInt(id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    // Get all messages in conversation
    const messages = await db
      .select()
      .from(smsMessageEvents)
      .where(eq(smsMessageEvents.conversationId, conversationId))
      .orderBy(desc(smsMessageEvents.createdAt));

    // Mark conversation as read
    await db
      .update(smsConversations)
      .set({ unreadCount: 0 })
      .where(eq(smsConversations.id, conversationId));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[Admin SMS Conversation Messages API] Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

const sendReplySchema = z.object({
  message: z.string().min(1).max(1600),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession();
    const { id } = await params;
    const conversationId = parseInt(id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Validate input
    const result = sendReplySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Get conversation
    const conversation = await db.query.smsConversations.findFirst({
      where: eq(smsConversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Send SMS via SimpleTexting
    await sendSMS({
      to: conversation.phone,
      message: result.data.message,
    });

    // Log message event
    const [messageEvent] = await db
      .insert(smsMessageEvents)
      .values({
        conversationId,
        contactId: conversation.contactId,
        phone: conversation.phone,
        direction: 'outbound',
        body: result.data.message,
        status: 'sent', // Will be updated by webhook
        sentAt: new Date(),
        provider: 'simpletexting',
      })
      .returning();

    // Update conversation
    await db
      .update(smsConversations)
      .set({
        totalMessages: conversation.totalMessages + 1,
        lastMessageAt: new Date(),
        lastMessagePreview: result.data.message.substring(0, 100),
        updatedAt: new Date(),
      })
      .where(eq(smsConversations.id, conversationId));

    console.log('[Admin SMS Conversation Messages API] Sent reply:', conversationId, conversation.phone);

    return NextResponse.json(messageEvent, { status: 201 });
  } catch (error) {
    console.error('[Admin SMS Conversation Messages API] Error sending reply:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
