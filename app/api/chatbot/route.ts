/**
 * Chatbot API - Main Endpoint
 * 
 * Handles AI chatbot conversations with OpenAI GPT-4o-mini
 * Includes conversation tracking, analytics, and message storage
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/server/db';
import { chatbotConversations, chatbotMessages, chatbotAnalytics } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const SYSTEM_PROMPT = `You are an AI assistant for Economy Plumbing Services, a trusted plumbing company serving Austin and Marble Falls, Texas.

Your role:
- Answer common plumbing questions (water heaters, drains, leaks, pricing estimates)
- Help customers understand services
- Provide general scheduling information
- Be friendly, helpful, and professional
- Provide DIY tips for minor issues while emphasizing safety

Services we offer:
- Water heater installation & repair (tank and tankless)
- Drain cleaning & hydro jetting
- Leak detection & repair
- Emergency plumbing (24/7)
- Backflow testing
- Commercial plumbing
- Gas line services
- Toilet & faucet repair
- VIP Membership (priority service, discounts, annual inspections)

Pricing estimates:
- Water heater installation: $1,200-$2,800 depending on size
- Drain cleaning: $150-$400
- Leak repair: $200-$600
- Emergency service: Available 24/7
- VIP Membership: $299/year (includes 15% discount on all services)

Business hours:
- Regular: Monday-Friday 7 AM - 7 PM
- Emergency service: 24/7 available
- Service areas: Austin, Marble Falls, Cedar Park, Leander, Georgetown, Round Rock

Common DIY tips (always emphasize safety):
- Running toilet: Check flapper valve and fill valve
- Slow drain: Try plunger or baking soda/vinegar before chemicals
- Low water pressure: Check aerators for buildup
- Frozen pipes: Never use open flame, use hair dryer or space heater

Appointment Booking:
- When customer asks to schedule or book an appointment, respond with: "I'll open our scheduling system for you now! Select a service and pick a time that works best for you. Our online scheduler will show you available appointment slots."
- Then include [SHOW_SCHEDULER] in your response to trigger the scheduler

Handoff to Human:
- If you cannot answer a complex question or customer is frustrated/angry, respond with empathy and indicate you'll connect them with a human representative
- Include [REQUEST_HANDOFF] in your response to flag for human follow-up

Tone: Friendly, professional, helpful. Use conversational language. Be concise but thorough.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, conversationId, pageContext, customerEmail, customerPhone } = await req.json();

    // Validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const [existing] = await db
        .select()
        .from(chatbotConversations)
        .where(eq(chatbotConversations.id, conversationId));
      conversation = existing;
    }

    if (!conversation) {
      // Create new conversation
      const [newConv] = await db
        .insert(chatbotConversations)
        .values({
          sessionId,
          pageContext: pageContext || 'unknown',
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
        })
        .returning();
      conversation = newConv;

      // Store the first message
      if (messages?.length > 0) {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
          await db.insert(chatbotMessages).values({
            conversationId: conversation.id,
            role: 'user',
            content: lastUserMessage.content,
          });

          // Track analytics
          await trackQuestionAnalytics(lastUserMessage.content);
        }
      }
    } else {
      // Store the latest user message
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        await db.insert(chatbotMessages).values({
          conversationId: conversation.id,
          role: 'user',
          content: lastUserMessage.content,
        });
      }
    }

    // Check OpenAI configuration
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      const fallbackMessage = "I'm having trouble connecting right now. Please text or call us directly for immediate assistance!";

      await db.insert(chatbotMessages).values({
        conversationId: conversation.id,
        role: 'assistant',
        content: fallbackMessage,
      });

      return NextResponse.json({
        message: fallbackMessage,
        needsHandoff: true,
        conversationId: conversation.id,
      });
    }

    // Call OpenAI
    const openai = new OpenAI({ apiKey: openaiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, I am having trouble responding right now.';

    // Check for special triggers
    const showScheduler = assistantMessage.includes('[SHOW_SCHEDULER]');
    const needsHandoff = assistantMessage.includes('[REQUEST_HANDOFF]');

    // Clean triggers from message
    const cleanMessage = assistantMessage.replace(/\[SHOW_SCHEDULER\]/g, '').replace(/\[REQUEST_HANDOFF\]/g, '').trim();

    // Store assistant message
    await db.insert(chatbotMessages).values({
      conversationId: conversation.id,
      role: 'assistant',
      content: cleanMessage,
    });

    // Update conversation if handoff requested
    if (needsHandoff) {
      await db
        .update(chatbotConversations)
        .set({ handoffRequested: true })
        .where(eq(chatbotConversations.id, conversation.id));
    }

    return NextResponse.json({
      message: cleanMessage,
      conversationId: conversation.id,
      showScheduler,
      needsHandoff,
    });

  } catch (error: any) {
    console.error('[Chatbot API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

async function trackQuestionAnalytics(question: string) {
  try {
    const questionLower = question.toLowerCase();
    let category = 'general';

    if (questionLower.includes('price') || questionLower.includes('cost')) category = 'pricing';
    else if (questionLower.includes('emergency') || questionLower.includes('urgent')) category = 'emergency';
    else if (questionLower.includes('schedule') || questionLower.includes('appointment')) category = 'scheduling';
    else if (questionLower.includes('water heater')) category = 'water_heater';
    else if (questionLower.includes('drain') || questionLower.includes('clog')) category = 'drain';
    else if (questionLower.includes('leak')) category = 'leak';

    const [existing] = await db
      .select()
      .from(chatbotAnalytics)
      .where(eq(chatbotAnalytics.question, question));

    if (existing) {
      await db
        .update(chatbotAnalytics)
        .set({
          count: existing.count + 1,
          lastAsked: new Date(),
        })
        .where(eq(chatbotAnalytics.id, existing.id));
    } else {
      await db.insert(chatbotAnalytics).values({
        question,
        category,
        count: 1,
        lastAsked: new Date(),
      });
    }
  } catch (error) {
    console.error('[Chatbot Analytics] Error:', error);
    // Don't fail the request if analytics fails
  }
}
