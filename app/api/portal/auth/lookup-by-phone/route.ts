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
    const normalizedPhone = phone.replace(/\D/g, '');
    console.log("[Portal Phone Auth] Normalized phone:", normalizedPhone);

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
          sql`REPLACE(REPLACE(REPLACE(${customersXlsx.phone}, '-', ''), '(', ''), ')', '') LIKE '%' || ${normalizedPhone} || '%'`
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

    // Check if customer has email
    if (!customer.email) {
      console.log("[Portal Phone Auth] ERROR: No email found for customer", customer.id);
      return NextResponse.json({ 
        error: "No email address found for this account. Please contact us directly." 
      }, { status: 404 });
    }

    const primaryEmail = customer.email.trim();

    // Mask the email for privacy (show first 2 chars and domain)
    const maskEmail = (email: string) => {
      const [localPart, domain] = email.split('@');
      if (!localPart || !domain) return email;
      
      const visibleChars = Math.min(2, localPart.length);
      const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(Math.max(3, localPart.length - visibleChars));
      return `${maskedLocal}@${domain}`;
    };

    const maskedEmail = maskEmail(primaryEmail);

    // Generate a secure lookup token
    const lookupToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store lookup in database
    await db.insert(phoneLoginLookups).values({
      lookupToken,
      phone: normalizedPhone,
      email: primaryEmail,
      customerId: customer.id,
      expiresAt,
    });

    console.log("[Portal Phone Auth] SUCCESS: Found customer", customer.id, "with email", primaryEmail);
    console.log("[Portal Phone Auth] Stored lookup token, expires at:", expiresAt);

    return NextResponse.json({
      customerId: customer.id,
      email: primaryEmail,
      maskedEmail: maskedEmail,
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
