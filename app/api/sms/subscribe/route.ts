/**
 * Public API - SMS Subscription
 * 
 * Handle SMS marketing list signups
 * 
 * TODO: Create dedicated smsContacts table in schema instead of using contactSubmissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../server/db';
import { contactSubmissions } from '../../../shared/schema';
import { z } from 'zod';

const smsSubscribeSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
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
    return false; // Max 5 signups per hour
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
        { error: 'Too many signups. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = smsSubscribeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // TODO: Replace with dedicated SMS contacts table
    // For now, store in contactSubmissions with service='sms_signup'
    const [contact] = await db
      .insert(contactSubmissions)
      .values({
        name: `${result.data.firstName} ${result.data.lastName}`,
        phone: result.data.phone,
        service: 'sms_signup',
        message: 'SMS marketing list signup',
        pageContext: '/sms-signup',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to SMS alerts!',
      contactId: contact.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[SMS Subscribe API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
