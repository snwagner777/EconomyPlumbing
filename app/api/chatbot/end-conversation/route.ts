/**
 * End Chatbot Conversation
 * 
 * Ends a conversation, saves rating, and sends transcript to admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { chatbotConversations, chatbotMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getUncachableResendClient } from '@/server/email';

const endConversationSchema = z.object({
  conversationId: z.string(),
  rating: z.number().min(1).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = endConversationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { conversationId, rating } = result.data;

    // Get conversation and messages
    const [conversation] = await db
      .select()
      .from(chatbotConversations)
      .where(eq(chatbotConversations.id, conversationId));

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(chatbotMessages)
      .where(eq(chatbotMessages.conversationId, conversationId))
      .orderBy(chatbotMessages.createdAt);

    // Update conversation
    await db
      .update(chatbotConversations)
      .set({
        endedAt: new Date(),
        rating: rating || null,
        emailSent: true,
      })
      .where(eq(chatbotConversations.id, conversationId));

    // Send email to admin if configured
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail && messages.length > 0) {
      try {
        const { client, fromEmail } = await getUncachableResendClient();

        // Format conversation for email
        const conversationHtml = messages.map(msg => `
          <div style="margin: 10px 0; padding: 10px; background: ${msg.role === 'user' ? '#f0f0f0' : '#e3f2fd'}; border-radius: 8px;">
            <strong>${msg.role === 'user' ? 'Customer' : 'AI Assistant'}:</strong><br/>
            ${msg.content}
            ${msg.feedback ? `<br/><small>Feedback: ${msg.feedback}</small>` : ''}
          </div>
        `).join('');

        const emailHtml = `
          <h2>Chatbot Conversation Log</h2>
          <p><strong>Session ID:</strong> ${conversation.sessionId}</p>
          <p><strong>Page Context:</strong> ${conversation.pageContext || 'Unknown'}</p>
          <p><strong>Started:</strong> ${new Date(conversation.startedAt).toLocaleString()}</p>
          <p><strong>Rating:</strong> ${rating ? `${rating}/5 stars` : 'Not rated'}</p>
          ${conversation.handoffRequested ? '<p><strong>⚠️ Handoff Requested</strong></p>' : ''}
          ${conversation.customerEmail ? `<p><strong>Customer Email:</strong> ${conversation.customerEmail}</p>` : ''}
          ${conversation.customerPhone ? `<p><strong>Customer Phone:</strong> ${conversation.customerPhone}</p>` : ''}
          <hr/>
          <h3>Conversation:</h3>
          ${conversationHtml}
        `;

        await client.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject: `Chatbot Conversation ${conversation.handoffRequested ? '- HANDOFF NEEDED' : ''}`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error('[Chatbot] Failed to send conversation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Chatbot End Conversation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to end conversation' },
      { status: 500 }
    );
  }
}
