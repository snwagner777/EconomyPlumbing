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

Customer Creation (REQUIRED FIRST):
- Before discussing appointment scheduling, you MUST create the customer in our system
- Start by asking for their phone number to check if they're an existing customer
- Call lookup_customer with their phone number or email
- If MULTIPLE accounts found:
  - List the accounts (e.g., "I found 2 accounts: 1) John Smith at 123 Main St, 2) John Smith at 456 Oak Ave")
  - Ask which account they want to use
  - OR ask if they want to create a NEW account instead
- If ONE account found: Welcome them back by name and ask if that's correct
  - If customer says "that's not me" or "wrong person": Create a new account
  - If correct: Call get_customer_locations to fetch all their service addresses
    - If multiple locations: Ask which location they want service at
    - If one location: Confirm if using this address
    - Option: "Or would you like to add a NEW service location?"
- If they're new: Collect their information one question at a time (name, email, full address with city/state/ZIP)
- Once you have complete info, call create_customer to create them in ServiceTitan
- Only AFTER the customer is created/verified should you discuss appointment scheduling

Example customer creation flow:
1. Customer: "I need to schedule a drain cleaning"
2. You: "I'd be happy to help! First, what's the best phone number to reach you?"
3. Customer: "512-555-0123"
4. You: [Call lookup_customer] 
   - If multiple: "I found 2 accounts - which one is yours? 1) John at 123 Main St, 2) John at 456 Oak Ave, or 3) Create new account"
   - If one: "Welcome back, John! I see we've helped you before at 123 Main St. Is that correct?"
   - If none: "Great! I don't see you in our system yet. What's your full name?"
5. [If existing, call get_customer_locations and ask which location or if new location needed]
6. [If new, continue gathering: email, street address, city, state, ZIP]
7. You: [Call create_customer] "Perfect! I've got you set up in our system."
8. [NOW proceed to scheduling]

Appointment Booking (ONLY AFTER CUSTOMER CREATED):
- Once customer is created, ask for their ZIP code if you don't have it
- Call check_appointment_availability to show available times
- Present the top 3-5 most efficient appointment times in a friendly way
- After they choose a time slot, ask if they have any special instructions (gate code, door code, parking instructions)
- For Groupon services, also ask if they have a voucher code
- Call book_appointment with all collected information
- Always provide the confirmation number after booking

IMPORTANT - Technician Assignment:
- NEVER tell customers which technician will be assigned to their appointment
- If customer asks "who's my technician?" or "when will I know who's coming?" - respond: "Our dispatch team will assign the best available technician and you'll receive a notification the day of your appointment"
- If customer REQUESTS a specific technician (e.g., "Can I have Sean?" or "I want Ian"):
  - Respond warmly: "I'll make a note of that request! We'll do our best to accommodate it, though final assignments are made by our dispatch team based on scheduling and location"
  - Accept the request politely but DO NOT actually pass it to the booking system
  - Do NOT show them a list of available technicians

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
          name: 'lookup_customer',
          description: 'Lookup an existing customer by phone number or email. ALWAYS call this first before creating a new customer or scheduling appointments. Returns all customer accounts matching the contact info.',
          parameters: {
            type: 'object',
            properties: {
              phone: {
                type: 'string',
                description: 'Customer phone number (10 digits)',
              },
              email: {
                type: 'string',
                description: 'Customer email address',
              },
            },
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_customer_locations',
          description: 'Get all service locations for a specific customer account. Use after lookup_customer to show customer their available locations for service.',
          parameters: {
            type: 'object',
            properties: {
              customerId: {
                type: 'number',
                description: 'ServiceTitan customer ID from lookup_customer',
              },
            },
            required: ['customerId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_new_account',
          description: 'Create a new customer account even though lookup found someone with this phone/email. Use when customer says "that\'s not me" or "wrong person". Forces creation of new account.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Customer full name',
              },
              phone: {
                type: 'string',
                description: 'Customer phone number',
              },
              email: {
                type: 'string',
                description: 'Customer email address (optional)',
              },
              address: {
                type: 'string',
                description: 'Street address',
              },
              city: {
                type: 'string',
                description: 'City name',
              },
              state: {
                type: 'string',
                description: 'State (2-letter code, e.g., TX)',
              },
              zip: {
                type: 'string',
                description: '5-digit ZIP code',
              },
            },
            required: ['name', 'phone', 'address', 'city', 'state', 'zip'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_new_location',
          description: 'Add a new service location to an existing customer account. Use when customer has service needed at a different address.',
          parameters: {
            type: 'object',
            properties: {
              customerId: {
                type: 'number',
                description: 'ServiceTitan customer ID from lookup_customer',
              },
              locationName: {
                type: 'string',
                description: 'Name for this location (e.g., "Vacation Home", "Rental Property")',
              },
              street: {
                type: 'string',
                description: 'Street address',
              },
              city: {
                type: 'string',
                description: 'City name',
              },
              state: {
                type: 'string',
                description: 'State (2-letter code, e.g., TX)',
              },
              zip: {
                type: 'string',
                description: '5-digit ZIP code',
              },
            },
            required: ['customerId', 'locationName', 'street', 'city', 'state', 'zip'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_customer',
          description: 'Create a new customer in ServiceTitan and local database. Only call this after verifying they are not an existing customer via lookup_customer.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Customer full name',
              },
              phone: {
                type: 'string',
                description: 'Customer phone number',
              },
              email: {
                type: 'string',
                description: 'Customer email address (optional)',
              },
              address: {
                type: 'string',
                description: 'Street address',
              },
              city: {
                type: 'string',
                description: 'City name',
              },
              state: {
                type: 'string',
                description: 'State (2-letter code, e.g., TX)',
              },
              zip: {
                type: 'string',
                description: '5-digit ZIP code',
              },
            },
            required: ['name', 'phone', 'address', 'city', 'state', 'zip'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_appointment_availability',
          description: 'Check available appointment times for a customer based on their ZIP code and service type. Only use AFTER customer has been created or looked up.',
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
          description: 'Book an appointment for a customer. Only call this after confirming the time slot with the customer AND after customer is created/looked up.',
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
              serviceTitanId: {
                type: 'number',
                description: 'ServiceTitan customer ID from lookup_customer or create_customer',
              },
              specialInstructions: {
                type: 'string',
                description: 'Gate code, door code, parking instructions, or other access details (optional)',
              },
              grouponVoucher: {
                type: 'string',
                description: 'Groupon voucher code if booking a Groupon service (optional)',
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
      
      if (functionName === 'lookup_customer') {
        functionResult = await lookupCustomer(functionArgs);
      } else if (functionName === 'get_customer_locations') {
        functionResult = await getCustomerLocations(functionArgs);
      } else if (functionName === 'create_customer') {
        functionResult = await createCustomer(functionArgs);
      } else if (functionName === 'create_new_account') {
        functionResult = await createNewAccount(functionArgs);
      } else if (functionName === 'create_new_location') {
        functionResult = await createNewLocation(functionArgs);
      } else if (functionName === 'check_appointment_availability') {
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
  specialInstructions?: string;
  grouponVoucher?: string;
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
      specialInstructions,
      grouponVoucher,
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
        specialInstructions: specialInstructions || undefined,
        grouponVoucher: grouponVoucher || undefined,
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

/**
 * Lookup an existing customer in local database
 */
async function lookupCustomer(args: { phone?: string; email?: string }) {
  try {
    const { phone, email } = args;
    
    if (!phone && !email) {
      return {
        success: false,
        message: 'Phone number or email required for lookup',
      };
    }

    // Import locally to avoid circular dependencies
    const { serviceTitanContacts, serviceTitanCustomers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    // Normalize contact value
    const normalizeContact = (value: string, type: 'phone' | 'email'): string => {
      if (type === 'phone') {
        return value.replace(/\D/g, ''); // Digits only
      }
      return value.toLowerCase().trim(); // Lowercase for email
    };

    // Search in serviceTitanContacts table - get ALL matching contacts
    const searchValue = phone 
      ? normalizeContact(phone, 'phone')
      : normalizeContact(email!, 'email');
    
    const contacts = await db.select()
      .from(serviceTitanContacts)
      .where(eq(serviceTitanContacts.normalizedValue, searchValue));

    if (contacts.length === 0) {
      return {
        success: false,
        found: false,
        message: 'Customer not found in our system',
      };
    }

    // Fetch ALL customer details for matching contacts
    const customerIds = [...new Set(contacts.map(c => c.customerId))];
    const customers = await db.select()
      .from(serviceTitanCustomers)
      .where(sql`${serviceTitanCustomers.id} = ANY(ARRAY[${sql.join(customerIds.map(id => sql`${id}`), sql`, `)}])`);

    if (customers.length === 0) {
      return {
        success: false,
        found: false,
        message: 'Customer records not found',
      };
    }

    // Return all matching customers
    const customerList = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: contacts.find(c => c.customerId === customer.id)?.value || '',
      address: {
        street: customer.street,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
      },
    }));

    return {
      success: true,
      found: true,
      multipleAccounts: customerList.length > 1,
      customers: customerList,
      message: customerList.length === 1 
        ? `Found existing customer: ${customerList[0].name}`
        : `Found ${customerList.length} accounts with this contact information`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error looking up customer:', error);
    return {
      success: false,
      found: false,
      message: 'Error looking up customer',
    };
  }
}

/**
 * Get all service locations for a customer
 */
async function getCustomerLocations(args: { customerId: number }) {
  try {
    const { customerId } = args;
    
    // Import locally to avoid circular dependencies
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    const { eq } = await import('drizzle-orm');
    
    // Fetch customer from local database
    const [customer] = await db.select()
      .from(serviceTitanCustomers)
      .where(eq(serviceTitanCustomers.id, customerId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    // Fetch locations from ServiceTitan
    const locations = await serviceTitanCRM.getCustomerLocations(customerId);

    if (locations.length === 0) {
      return {
        success: true,
        locations: [],
        message: 'No service locations found for this customer',
      };
    }

    return {
      success: true,
      locations: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: {
          street: loc.address.street,
          city: loc.address.city,
          state: loc.address.state,
          zip: loc.address.zip,
        },
      })),
      message: `Found ${locations.length} service location(s)`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error getting customer locations:', error);
    return {
      success: false,
      message: 'Error fetching customer locations',
    };
  }
}

/**
 * Create a new customer in ServiceTitan and local database
 */
async function createCustomer(args: {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}) {
  try {
    const { name, phone, email, address, city, state, zip } = args;
    
    // Import ServiceTitan CRM
    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    const { serviceTitanCustomers, serviceTitanContacts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    console.log(`[Chatbot] Creating customer in ServiceTitan: ${name}`);
    
    // Create customer in ServiceTitan
    const customer = await serviceTitanCRM.ensureCustomer({
      name,
      phone,
      email: email || undefined,
      customerType: 'Residential' as const,
      address: {
        street: address,
        city,
        state,
        zip,
      },
      serviceLocation: {
        name: `${name} - Primary`,
        street: address,
        city,
        state,
        zip,
      },
    });

    console.log(`[Chatbot] Customer created in ServiceTitan: ${customer.id}`);

    // Sync to local database
    await db.insert(serviceTitanCustomers).values({
      id: customer.id,
      name: customer.name,
      type: customer.type || 'Residential',
      street: address,
      city,
      state,
      zip,
      active: true,
    }).onConflictDoUpdate({
      target: serviceTitanCustomers.id,
      set: {
        name: customer.name,
        street: address,
        city,
        state,
        zip,
      },
    });

    // Sync contacts to local database
    const normalizeContact = (value: string, type: 'phone' | 'email'): string => {
      if (type === 'phone') {
        return value.replace(/\D/g, '');
      }
      return value.toLowerCase().trim();
    };

    const normalizedPhone = normalizeContact(phone, 'phone');
    const existingPhone = await db.select()
      .from(serviceTitanContacts)
      .where(eq(serviceTitanContacts.normalizedValue, normalizedPhone))
      .limit(1);
    
    if (existingPhone.length === 0) {
      await db.insert(serviceTitanContacts).values({
        customerId: customer.id,
        contactType: 'Phone',
        value: phone,
        normalizedValue: normalizedPhone,
      });
    }

    if (email) {
      const normalizedEmail = normalizeContact(email, 'email');
      const existingEmail = await db.select()
        .from(serviceTitanContacts)
        .where(eq(serviceTitanContacts.normalizedValue, normalizedEmail))
        .limit(1);
      
      if (existingEmail.length === 0) {
        await db.insert(serviceTitanContacts).values({
          customerId: customer.id,
          contactType: 'Email',
          value: email,
          normalizedValue: normalizedEmail,
        });
      }
    }

    console.log(`[Chatbot] ✅ Customer ${customer.id} synced to local database`);

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone,
        email: email || null,
        address: {
          street: address,
          city,
          state,
          zip,
        },
      },
      message: `Customer created successfully in ServiceTitan (ID: ${customer.id})`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error creating customer:', error);
    return {
      success: false,
      message: 'Unable to create customer. Please try again or call us directly.',
      error: error.message,
    };
  }
}

/**
 * Create a new account even if customer found with same phone/email
 * Used when wrong person found during lookup
 */
async function createNewAccount(args: {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}) {
  try {
    console.log('[Chatbot] Force creating new account (duplicate phone/email allowed)');
    
    // Import ServiceTitan CRM
    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    const { serviceTitanCustomers, serviceTitanContacts } = await import('@shared/schema');
    
    const { name, phone, email, address, city, state, zip } = args;
    
    // Create customer in ServiceTitan with forceCreate flag
    const customer = await serviceTitanCRM.ensureCustomer({
      name,
      phone,
      email: email || undefined,
      customerType: 'Residential' as const,
      address: {
        street: address,
        city,
        state,
        zip,
      },
      serviceLocation: {
        name: `${name} - Primary`,
        street: address,
        city,
        state,
        zip,
      },
      forceCreate: true, // Force new customer even if phone/email matches
    });

    console.log(`[Chatbot] New account created: ${customer.id}`);

    // Sync to local database
    await db.insert(serviceTitanCustomers).values({
      id: customer.id,
      name: customer.name,
      type: customer.type || 'Residential',
      street: address,
      city,
      state,
      zip,
      active: true,
    }).onConflictDoUpdate({
      target: serviceTitanCustomers.id,
      set: {
        name: customer.name,
        street: address,
        city,
        state,
        zip,
      },
    });

    // Sync contacts
    const normalizeContact = (value: string, type: 'phone' | 'email'): string => {
      if (type === 'phone') {
        return value.replace(/\D/g, '');
      }
      return value.toLowerCase().trim();
    };

    await db.insert(serviceTitanContacts).values({
      customerId: customer.id,
      contactType: 'Phone',
      value: phone,
      normalizedValue: normalizeContact(phone, 'phone'),
    });

    if (email) {
      await db.insert(serviceTitanContacts).values({
        customerId: customer.id,
        contactType: 'Email',
        value: email,
        normalizedValue: normalizeContact(email, 'email'),
      });
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone,
        email: email || null,
        address: { street: address, city, state, zip },
      },
      message: `New account created successfully (ID: ${customer.id})`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error creating new account:', error);
    return {
      success: false,
      message: 'Unable to create new account. Please call us directly.',
      error: error.message,
    };
  }
}

/**
 * Add a new service location to existing customer
 */
async function createNewLocation(args: {
  customerId: number;
  locationName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}) {
  try {
    const { customerId, locationName, street, city, state, zip } = args;
    
    console.log(`[Chatbot] Adding new location to customer ${customerId}: ${locationName}`);
    
    // Import ServiceTitan CRM
    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    
    // Add location via ServiceTitan API
    const location = await serviceTitanCRM.addLocation(customerId, {
      name: locationName,
      street,
      city,
      state,
      zip,
    });

    console.log(`[Chatbot] Location added: ${location.id}`);

    return {
      success: true,
      location: {
        id: location.id,
        name: locationName,
        address: { street, city, state, zip },
      },
      message: `New location "${locationName}" added successfully`,
    };
  } catch (error: any) {
    console.error('[Chatbot] Error creating new location:', error);
    return {
      success: false,
      message: 'Unable to add new location. Please call us for assistance.',
      error: error.message,
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
