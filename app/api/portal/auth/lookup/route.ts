import { NextRequest, NextResponse } from 'next/server';
import { customersXlsx, portalVerifications } from '@shared/schema';
import { or, eq, and, gt, sql } from 'drizzle-orm';
import { generateOTP, sendOTP } from '@/server/lib/sms';

// Rate limiting: Track OTP requests per contact value
const otpRequestTracker = new Map<string, { count: number; resetAt: number }>();
const MAX_OTP_REQUESTS = 5; // Max 5 OTP requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(contactValue: string): boolean {
  const now = Date.now();
  const tracker = otpRequestTracker.get(contactValue);
  
  if (!tracker || now > tracker.resetAt) {
    // Reset or create new tracker
    otpRequestTracker.set(contactValue, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }
  
  if (tracker.count >= MAX_OTP_REQUESTS) {
    return false;
  }
  
  tracker.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const body = await request.json();
    const { lookupType, lookupValue } = body;
    
    if (!lookupType || !lookupValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (lookupType !== 'phone' && lookupType !== 'email') {
      return NextResponse.json(
        { error: 'Invalid lookup type. Must be "phone" or "email"' },
        { status: 400 }
      );
    }
    
    const normalizedValue = lookupValue.trim().toLowerCase();
    
    // Normalize for rate limiting to prevent bypass via formatting
    // Phone: use last 10 digits only
    // Email: use lowercase
    const rateLimitKey = lookupType === 'phone'
      ? normalizedValue.replace(/\D/g, '').slice(-10)
      : normalizedValue.toLowerCase();
    
    // Rate limiting check
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`[Portal Lookup] Rate limit exceeded for: ${rateLimitKey}`);
      return NextResponse.json(
        { error: 'Too many verification requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    console.log(`[Portal Lookup] Looking up customer by ${lookupType}:`, normalizedValue);
    
    // Search for customers in the local database (customers_xlsx)
    let customers;
    if (lookupType === 'phone') {
      // Normalize phone: remove all non-digits
      const phoneDigits = normalizedValue.replace(/\D/g, '');
      
      // Search by phone (match last 10 digits)
      customers = await db
        .select({
          id: customersXlsx.id,
          name: customersXlsx.name,
          phone: customersXlsx.phone,
          email: customersXlsx.email,
        })
        .from(customersXlsx)
        .where(
          sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') LIKE '%' || ${phoneDigits.slice(-10)}`
        );
    } else {
      // Search by email
      customers = await db
        .select({
          id: customersXlsx.id,
          name: customersXlsx.name,
          phone: customersXlsx.phone,
          email: customersXlsx.email,
        })
        .from(customersXlsx)
        .where(eq(customersXlsx.email, normalizedValue));
    }
    
    if (!customers || customers.length === 0) {
      console.log(`[Portal Lookup] No customers found for: ${normalizedValue}`);
      return NextResponse.json(
        { error: `No account found with this ${lookupType}. Please check your ${lookupType} or contact us for assistance.` },
        { status: 404 }
      );
    }
    
    console.log(`[Portal Lookup] Found ${customers.length} customer(s)`);
    
    // Generate OTP code
    const code = generateOTP(); // 6-digit code from sms.ts
    const customerIds = customers.map(c => c.id);
    
    // Set expiry: 10 minutes for SMS, 1 hour for email
    const expiryMinutes = lookupType === 'phone' ? 10 : 60;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    // Normalize contact value for consistent lookups
    // Phone: store last 10 digits only
    // Email: store lowercase
    const normalizedContact = lookupType === 'phone'
      ? (customers[0].phone || '').replace(/\D/g, '').slice(-10)
      : normalizedValue.toLowerCase();
    
    // Store verification in database
    const [verification] = await db
      .insert(portalVerifications)
      .values({
        verificationType: lookupType === 'phone' ? 'sms' : 'email',
        contactValue: normalizedContact, // Normalized for consistent lookups
        code,
        customerIds,
        expiresAt,
        verified: false,
        attempts: 0,
      })
      .returning();
    
    console.log(`[Portal Lookup] Created verification:`, verification.id);
    
    // Send verification code
    if (lookupType === 'phone') {
      const customerPhone = customers[0].phone;
      if (!customerPhone) {
        return NextResponse.json(
          { error: 'Customer phone number not found in database' },
          { status: 404 }
        );
      }
      
      try {
        await sendOTP(customerPhone, code);
        console.log(`[Portal Lookup] ✅ SMS OTP sent to: ${customerPhone}`);
      } catch (error: any) {
        console.error('[Portal Lookup] Failed to send SMS:', error);
        // Delete the verification since we couldn't send it
        if (verification?.id) {
          await db.delete(portalVerifications).where(eq(portalVerifications.id, verification.id));
        }
        return NextResponse.json(
          { error: 'Failed to send verification code. Please try again.' },
          { status: 500 }
        );
      }
    } else {
      // Email sending would go here (using Resend)
      // For now, log the code for testing
      console.log(`[Portal Lookup] Email OTP code: ${code} (Email sending not yet implemented)`);
      
      // TODO: Implement email sending via Resend
      return NextResponse.json(
        { error: 'Email verification not yet implemented. Please use phone login.' },
        { status: 501 }
      );
    }
    
    return NextResponse.json({
      success: true,
      token: verification.id, // Use verification ID as token
      message: `Verification code sent to ${lookupType === 'phone' ? 'your phone' : 'your email'}`,
      expiresIn: expiryMinutes * 60, // seconds
    });
  } catch (error: any) {
    console.error('[Portal Lookup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lookup failed' },
      { status: 500 }
    );
  }
}
