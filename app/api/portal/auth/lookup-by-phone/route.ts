import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx, phoneLoginLookups } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    console.log("[Portal Phone Auth] === PHONE LOOKUP REQUEST RECEIVED ===");
    const body = await req.json();
    console.log("[Portal Phone Auth] Request body:", JSON.stringify(body));
    
    const { phone } = body;

    if (!phone) {
      console.log("[Portal Phone Auth] ERROR: No phone number provided in request");
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    console.log("[Portal Phone Auth] Raw phone from request:", phone);
    let normalizedPhone = phone.replace(/\D/g, '');
    
    // Normalize to 10 digits - strip leading "1" if present (US country code)
    if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    
    console.log("[Portal Phone Auth] Normalized phone:", normalizedPhone);

    // Validate phone number length (US phones are 10 digits)
    if (normalizedPhone.length !== 10) {
      console.log("[Portal Phone Auth] ERROR: Invalid phone length:", normalizedPhone.length);
      return NextResponse.json({
        found: false,
        error: "Please enter a valid 10-digit phone number"
      }, { status: 400 });
    }

    // Search for phone in customers_xlsx table directly
    // FILTER OUT INACTIVE CUSTOMERS - only allow login for active customers
    console.log("[Portal Phone Auth] Querying database for phone:", normalizedPhone);
    
    // Search customers_xlsx for matching phone number (active customers only)
    const customers = await db
      .select({
        id: customersXlsx.id,
        name: customersXlsx.name,
        email: customersXlsx.email,
        phone: customersXlsx.phone,
      })
      .from(customersXlsx)
      .where(
        and(
          eq(customersXlsx.active, true), // Only active customers
          // Exact phone match using normalized numbers
          sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`
        )
      )
      .limit(1);

    console.log("[Portal Phone Auth] Query results:", {
      found: customers.length > 0,
      count: customers.length
    });

    if (customers.length === 0) {
      console.log("[Portal Phone Auth] No customer found for phone:", normalizedPhone);
      return NextResponse.json({
        found: false,
        message: "No customer found with this phone number"
      });
    }

    const customer = customers[0];
    console.log("[Portal Phone Auth] Found customer:", {
      customerId: customer.id,
      name: customer.name,
      hasEmail: !!customer.email,
      hasPhone: !!customer.phone
    });

    // Mask phone for display
    const maskPhone = (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) {
        return `(***) ***-${digits.slice(-4)}`;
      }
      return `***${digits.slice(-4)}`;
    };

    const maskedPhone = maskPhone(customer.phone || normalizedPhone);

    // Parse email field - could contain multiple comma-separated emails
    const parseEmails = (emailField: string | null): string[] => {
      if (!emailField || !emailField.trim()) return [];
      return emailField
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0 && e.includes('@'));
    };

    const emails = parseEmails(customer.email);
    const hasEmail = emails.length > 0;
    
    // Mask email for privacy (show first 2 chars and domain)
    const maskEmail = (email: string) => {
      const [localPart, domain] = email.split('@');
      if (!localPart || !domain) return email;
      
      const visibleChars = Math.min(2, localPart.length);
      const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(Math.max(3, localPart.length - visibleChars));
      return `${maskedLocal}@${domain}`;
    };

    // If customer has NO email, they must use SMS verification
    if (!hasEmail) {
      console.log("[Portal Phone Auth] Customer has no email, SMS verification required");
      
      // Generate lookup token for SMS flow
      const lookupToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Create phone_login_lookups record with null email (SMS verification)
      await db.insert(phoneLoginLookups).values({
        lookupToken,
        phone: normalizedPhone,
        email: null,
        customerId: customer.id,
        expiresAt,
      });

      console.log("[Portal Phone Auth] SUCCESS: Found customer (SMS only)", customer.id);
      
      return NextResponse.json({
        customerId: customer.id,
        phone: normalizedPhone,
        email: null,
        maskedContact: maskedPhone,
        maskedPhone: maskedPhone,
        verificationType: 'sms',
        lookupToken: lookupToken
      });
    }

    // If customer has MULTIPLE emails, return them for selection (don't create lookup yet)
    if (emails.length > 1) {
      console.log(`[Portal Phone Auth] Found ${emails.length} emails for customer ${customer.id}, requiring selection`);
      
      return NextResponse.json({
        customerId: customer.id,
        phone: normalizedPhone,
        requiresEmailSelection: true,
        emails: emails.map(email => ({
          value: email,
          masked: maskEmail(email)
        })),
        maskedPhone: maskedPhone,
        message: 'We found multiple email addresses for your account. Please select which one to use for verification.'
      });
    }

    // Customer has exactly ONE email - proceed with creating lookup record
    const primaryEmail = emails[0];
    const lookupToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(phoneLoginLookups).values({
      lookupToken,
      phone: normalizedPhone,
      email: primaryEmail,
      customerId: customer.id,
      expiresAt,
    });

    console.log("[Portal Phone Auth] SUCCESS: Found customer with single email", customer.id);
    console.log("[Portal Phone Auth] Contact:", primaryEmail);

    return NextResponse.json({
      customerId: customer.id,
      phone: normalizedPhone,
      email: primaryEmail,
      maskedContact: maskEmail(primaryEmail),
      maskedEmail: maskEmail(primaryEmail),
      maskedPhone: maskedPhone,
      verificationType: 'email',
      lookupToken: lookupToken
    });
  } catch (error: any) {
    console.error("[Portal Phone Auth] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lookup customer" },
      { status: 500 }
    );
  }
}
