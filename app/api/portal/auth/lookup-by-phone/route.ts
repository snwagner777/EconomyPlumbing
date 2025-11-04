import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { contactsXlsx, phoneLoginLookups } from '@shared/schema';
import { and, eq, or, sql } from 'drizzle-orm';
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

    // Search for phone in contacts_xlsx (handles comma-separated values)
    console.log("[Portal Phone Auth] Querying database for phone:", normalizedPhone);
    
    // Search using LIKE for comma-separated values and exact match
    const contacts = await db
      .select()
      .from(contactsXlsx)
      .where(
        and(
          eq(contactsXlsx.contactType, 'Phone'),
          or(
            sql`${contactsXlsx.normalizedValue} = ${normalizedPhone}`,
            sql`${contactsXlsx.normalizedValue} LIKE ${'%,' + normalizedPhone + ',%'}`,
            sql`${contactsXlsx.normalizedValue} LIKE ${normalizedPhone + ',%'}`,
            sql`${contactsXlsx.normalizedValue} LIKE ${'%,' + normalizedPhone}`
          )
        )
      )
      .limit(1);

    console.log("[Portal Phone Auth] Query results:", {
      found: contacts.length > 0,
      count: contacts.length
    });

    if (contacts.length === 0) {
      console.log("[Portal Phone Auth] No customer found for phone:", normalizedPhone);
      return NextResponse.json({
        found: false,
        message: "No customer found with this phone number"
      });
    }

    const phoneContact = contacts[0];
    console.log("[Portal Phone Auth] Found contact:", {
      customerId: phoneContact.customerId,
      contactType: phoneContact.contactType,
      value: phoneContact.value
    });

    // Now find the email for this customer
    console.log("[Portal Phone Auth] Looking for email for customer ID:", phoneContact.customerId);
    
    const emailContacts = await db
      .select()
      .from(contactsXlsx)
      .where(
        and(
          eq(contactsXlsx.customerId, phoneContact.customerId),
          eq(contactsXlsx.contactType, 'Email')
        )
      )
      .limit(1);

    console.log("[Portal Phone Auth] Found", emailContacts.length, "email contacts");

    if (emailContacts.length === 0) {
      console.log("[Portal Phone Auth] ERROR: No email found for customer", phoneContact.customerId);
      return NextResponse.json({ 
        error: "No email address found for this account. Please contact us directly." 
      }, { status: 404 });
    }

    const emailContact = emailContacts[0];
    // Handle comma-separated emails - take the first one
    const emails = emailContact.value.split(',').map((e: string) => e.trim());
    const primaryEmail = emails[0];

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
      customerId: phoneContact.customerId,
      expiresAt,
    });

    console.log("[Portal Phone Auth] SUCCESS: Found customer", phoneContact.customerId, "with email", primaryEmail);
    console.log("[Portal Phone Auth] Stored lookup token, expires at:", expiresAt);

    return NextResponse.json({
      customerId: phoneContact.customerId,
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
