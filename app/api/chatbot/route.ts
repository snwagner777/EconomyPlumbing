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

Appointment Booking (Conversational):
- When a customer wants to schedule, have a natural conversation to gather: ZIP code, service type, name, phone, and address
- Ask one question at a time - don't overwhelm them with a form
- Once you have their ZIP code, call check_appointment_availability to show available times
- Present the top 3-5 most efficient appointment times in a friendly way
- After they choose a time slot, confirm their details and call book_appointment
- Always provide the confirmation number after booking

Example booking flow:
1. Customer: "I need to schedule a drain cleaning"
2. You: "I'd be happy to help you schedule! What's your ZIP code?"
3. Customer: "78701"
4. You: [Call check_appointment_availability] "Great! I have several times available. Our most fuel-efficient slots are: [list top 3 times]. Which works best for you?"
5. Customer: "The Monday 9am slot"
6. You: "Perfect! Can I get your full name?"
7. [Continue gathering info: phone, address]
8. You: [Call book_appointment] "All set! Your appointment is confirmed for Monday at 9am. Your confirmation number is #12345"

Cancel & Reschedule Appointments:
- When a customer wants to cancel or reschedule, let them know they can do this easily through our customer portal
- Direct them to visit plumbersthatcare.com/customer-portal
- They can log in with their phone number to view and manage all their appointments
- Be empathetic and helpful - explain this is for their security to prevent unauthorized changes

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

    // Call OpenAI with function calling tools
    const openai = new OpenAI({ apiKey: openaiKey });

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'check_appointment_availability',
          description: 'Check available appointment times for a customer based on their ZIP code and service type. Use this when the customer wants to know available times or is ready to schedule.',
          parameters: {
            type: 'object',
            properties: {
              customerZip: {
                type: 'string',
                description: 'Customer 5-digit ZIP code (e.g., "78701")',
              },
              serviceType: {
                type: 'string',
                enum: ['standard', 'emergency', 'water_heater', 'drain'],
                description: 'Type of plumbing service needed',
              },
            },
            required: ['customerZip'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'book_appointment',
          description: 'Book an appointment for a customer. Only call this after confirming the time slot with the customer.',
          parameters: {
            type: 'object',
            properties: {
              customerName: {
                type: 'string',
                description: 'Customer full name',
              },
              customerPhone: {
                type: 'string',
                description: 'Customer phone number',
              },
              customerEmail: {
                type: 'string',
                description: 'Customer email address',
              },
              customerAddress: {
                type: 'string',
                description: 'Customer street address',
              },
              customerZip: {
                type: 'string',
                description: 'Customer 5-digit ZIP code',
              },
              slotId: {
                type: 'string',
                description: 'The slot ID from check_appointment_availability response',
              },
              serviceType: {
                type: 'string',
                description: 'Type of service needed',
              },
            },
            required: ['customerName', 'customerPhone', 'customerZip', 'slotId'],
          },
        },
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools,
      temperature: 0.7,
      max_tokens: 800,
    });

    const responseMessage = completion.choices[0]?.message;
    
    // Handle function calls
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      
      // Type assertion for function tool call
      if (toolCall.type !== 'function') {
        throw new Error('Unexpected tool call type');
      }
      
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      let functionResult: any;
      
      if (functionName === 'check_appointment_availability') {
        functionResult = await checkAppointmentAvailability(functionArgs);
      } else if (functionName === 'book_appointment') {
        functionResult = await bookAppointment(functionArgs);
      }
      
      // Call OpenAI again with the function result
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          responseMessage,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });
      
      const finalMessage = secondCompletion.choices[0]?.message?.content || 'I apologize, I am having trouble responding right now.';
      
      // Store assistant message
      await db.insert(chatbotMessages).values({
        conversationId: conversation.id,
        role: 'assistant',
        content: finalMessage,
      });
      
      return NextResponse.json({
        message: finalMessage,
        conversationId: conversation.id,
        showScheduler: false,
        needsHandoff: false,
      });
    }
    
    // Handle regular message (no function call)
    const assistantMessage = responseMessage?.content || 'I apologize, I am having trouble responding right now.';

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

/**
 * Check appointment availability using the smart scheduler
 */
async function checkAppointmentAvailability(args: { customerZip: string; serviceType?: string }) {
  try {
    const { customerZip, serviceType = 'standard' } = args;
    
    // Map service type to job type ID (from ServiceTitan)
    const jobTypeMap: Record<string, number> = {
      standard: 140551181, // Standard Plumbing Repair
      emergency: 140551181, // Same as standard
      water_heater: 140551181, // Same for now
      drain: 140551181, // Same for now
    };
    
    const jobTypeId = jobTypeMap[serviceType] || 140551181;
    
    // Call smart availability API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/scheduler/smart-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTypeId,
        customerZip,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next 2 weeks
      }),
    });
    
    const data = await response.json();
    
    if (!data.success || !data.slots || data.slots.length === 0) {
      return {
        success: false,
        message: 'No appointment slots available. Please call us directly to schedule.',
      };
    }
    
    // Return top 5 most efficient slots
    const topSlots = data.slots.slice(0, 5).map((slot: any) => ({
      id: slot.id,
      date: new Date(slot.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: slot.timeLabel,
      efficiency: slot.proximityScore,
      zone: slot.zone,
    }));
    
    return {
      success: true,
      slots: topSlots,
      zone: data.optimization?.customerZone,
      message: `Found ${topSlots.length} available appointment times in the next 2 weeks.`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error checking availability:', error);
    return {
      success: false,
      message: 'Unable to check availability. Please call us to schedule.',
    };
  }
}

/**
 * Book an appointment using the scheduler API
 */
async function bookAppointment(args: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerZip: string;
  slotId: string;
  serviceType?: string;
}) {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerZip,
      slotId,
      serviceType = 'standard',
    } = args;
    
    // First, fetch the slot details
    const availabilityResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/scheduler/smart-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTypeId: 140551181,
        customerZip,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
    });
    
    const availabilityData = await availabilityResponse.json();
    const selectedSlot = availabilityData.slots?.find((s: any) => s.id === slotId);
    
    if (!selectedSlot) {
      return {
        success: false,
        message: 'Selected time slot is no longer available. Please choose another time.',
      };
    }
    
    // Book the appointment
    const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/scheduler/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerEmail: customerEmail || `${customerPhone}@placeholder.com`,
        customerAddress: customerAddress || 'Address provided via phone',
        customerZip,
        slot: selectedSlot,
        jobTypeId: 140551181,
        serviceDescription: `Scheduled via AI chat - ${serviceType}`,
      }),
    });
    
    const bookingData = await bookingResponse.json();
    
    if (!bookingData.success) {
      return {
        success: false,
        message: bookingData.error || 'Unable to book appointment. Please call us to complete booking.',
      };
    }
    
    return {
      success: true,
      confirmationNumber: bookingData.jobId,
      date: new Date(selectedSlot.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: selectedSlot.timeLabel,
      message: `Appointment booked successfully! Confirmation #${bookingData.jobId}`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error booking appointment:', error);
    return {
      success: false,
      message: 'Unable to complete booking. Please call us to finish scheduling your appointment.',
    };
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
