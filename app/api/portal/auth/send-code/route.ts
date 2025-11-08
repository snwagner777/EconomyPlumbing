import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { portalVerifications } from '@shared/schema';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactValue, verificationType } = body;

    if (!contactValue || !verificationType) {
      return NextResponse.json(
        { error: 'Contact value and verification type required' },
        { status: 400 }
      );
    }

    if (!['sms', 'email'].includes(verificationType)) {
      return NextResponse.json(
        { error: 'Invalid verification type' },
        { status: 400 }
      );
    }

    console.log(`[Portal Auth] Sending ${verificationType} verification to:`, contactValue);

    // Check if ServiceTitan is configured
    const tenantId = process.env.SERVICETITAN_TENANT_ID;
    const clientId = process.env.SERVICETITAN_CLIENT_ID;
    const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
    const appKey = process.env.SERVICETITAN_APP_KEY;

    if (!tenantId || !clientId || !clientSecret || !appKey) {
      return NextResponse.json(
        { error: 'ServiceTitan integration not configured' },
        { status: 503 }
      );
    }

    // Search ONLY in local XLSX synced cache (customers_xlsx table)
    const { customersXlsx } = await import('@shared/schema');
    const { or, sql, and, eq } = await import('drizzle-orm');
    
    const searchValue = contactValue.trim();
    let normalizedPhone = searchValue.replace(/\D/g, ''); // Remove non-digits for phone search
    
    // Normalize to 10 digits - strip leading "1" if present (US country code)
    if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    
    // Determine if we're searching by phone or email
    const isPhoneSearch = normalizedPhone.length === 10;
    
    // Validate phone number length if this is a phone search
    if (verificationType === 'sms' && normalizedPhone.length !== 10) {
      console.log('[Portal Auth] Invalid phone number length:', normalizedPhone.length);
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit phone number' },
        { status: 400 }
      );
    }
    
    // Build search condition based on whether we have a valid phone or just email
    let searchCondition;
    
    if (normalizedPhone.length >= 10) {
      // Search by BOTH email OR phone (exact matches only)
      searchCondition = or(
        sql`LOWER(${customersXlsx.email}) = LOWER(${searchValue})`,
        sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`
      );
    } else {
      // Only search by email (exact match)
      searchCondition = sql`LOWER(${customersXlsx.email}) = LOWER(${searchValue})`;
    }
    
    // Search by email OR phone in customers_xlsx (active customers only)
    const customers = await db
      .select({ 
        id: customersXlsx.id,
        email: customersXlsx.email,
        phone: customersXlsx.phone,
        name: customersXlsx.name
      })
      .from(customersXlsx)
      .where(
        and(
          eq(customersXlsx.active, true),
          searchCondition
        )
      )
      .limit(10);

    if (customers.length === 0) {
      console.log('[Portal Auth] No customer found in synced database');
      return NextResponse.json(
        {
          error:
            "We couldn't find an account with that email or phone number. Please verify your information or contact us at (512) 396-7811 for assistance.",
          found: false,
        },
        { status: 404 }
      );
    }

    // If searching by phone and multiple unique emails found, return them for selection
    if (isPhoneSearch && verificationType === 'email') {
      // Get unique emails (filter out nulls and duplicates)
      const uniqueEmails = Array.from(new Set(
        customers
          .map(c => c.email?.toLowerCase().trim())
          .filter((email): email is string => !!email)
      ));

      if (uniqueEmails.length > 1) {
        console.log(`[Portal Auth] Found ${uniqueEmails.length} unique emails for phone, asking user to select`);
        
        // Mask emails for privacy - hide both local part AND domain
        const maskEmail = (email: string) => {
          const [localPart, domain] = email.split('@');
          if (!localPart || !domain) return email;
          
          // Mask local part (show first 2 chars)
          const visibleLocalChars = Math.min(2, localPart.length);
          const maskedLocal = localPart.substring(0, visibleLocalChars) + '*'.repeat(Math.max(3, localPart.length - visibleLocalChars));
          
          // Mask domain (show first char and extension)
          const domainParts = domain.split('.');
          if (domainParts.length < 2) {
            // No extension, just mask the domain
            const maskedDomain = domainParts[0].charAt(0) + '*'.repeat(Math.max(3, domainParts[0].length - 1));
            return `${maskedLocal}@${maskedDomain}`;
          }
          
          // Has extension - mask the main part, keep extension
          const mainPart = domainParts.slice(0, -1).join('.');
          const extension = domainParts[domainParts.length - 1];
          const maskedDomain = mainPart.charAt(0) + '*'.repeat(Math.max(3, mainPart.length - 1));
          
          return `${maskedLocal}@${maskedDomain}.${extension}`;
        };

        return NextResponse.json({
          requiresEmailSelection: true,
          emails: uniqueEmails.map(email => ({
            masked: maskEmail(email),
            value: email
          })),
          message: 'Multiple email addresses found. Please select which one to use.'
        });
      }
    }

    const customerIds = customers.map(c => c.id);
    console.log(
      `[Portal Auth] Found ${customerIds.length} customer account(s) in cache:`,
      customerIds
    );

    // Generate 6-digit verification code for both SMS and email
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry time (10 min for SMS, 15 min for email)
    const expiryMinutes = verificationType === 'sms' ? 10 : 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store verification in database
    await db.insert(portalVerifications).values({
      verificationType,
      contactValue,
      code,
      customerIds, // Now storing array of customer IDs
      expiresAt,
    });

    console.log(
      '[Portal Auth] Verification code created, expiring in',
      expiryMinutes,
      'minutes'
    );

    // Send verification based on type
    if (verificationType === 'sms') {
      // Send SMS code
      try {
        const { sendSMS } = await import('@/server/lib/sms');

        // Format phone number to E.164 format (add +1 for US numbers if not present)
        let formattedPhone = contactValue.replace(/\D/g, ''); // Remove non-digits
        if (formattedPhone.length === 10) {
          formattedPhone = '+1' + formattedPhone; // US number
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
          formattedPhone = '+' + formattedPhone;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }

        console.log('[Portal Auth] Sending SMS to formatted number:', formattedPhone);

        const message = `Your Economy Plumbing verification code is: ${code}\n\nThis code expires in 10 minutes.`;
        await sendSMS({ to: formattedPhone, message });
        console.log('[Portal Auth] SMS sent successfully');

        return NextResponse.json({
          success: true,
          message: 'Verification code sent via SMS',
          expiresIn: expiryMinutes * 60, // seconds
        });
      } catch (error) {
        console.error('[Portal Auth] SMS send failed:', error);
        return NextResponse.json(
          { error: 'Failed to send SMS verification code' },
          { status: 500 }
        );
      }
    } else if (verificationType === 'email') {
      // Send email verification code
      try {
        const { sendEmail } = await import('@/server/email');

        await sendEmail({
          to: contactValue,
          subject: 'Your Customer Portal Verification Code - Economy Plumbing',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #0066cc; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Economy Plumbing Services</h1>
              </div>
              <div style="padding: 30px; background-color: #f9f9f9;">
                <h2>Your Verification Code</h2>
                <p>Enter this code to access your customer portal:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background-color: #fff; border: 2px solid #0066cc; border-radius: 8px; padding: 20px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0066cc;">${code}</span>
                  </div>
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in ${expiryMinutes} minutes.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email or contact us at (512) 396-7811.</p>
              </div>
              <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 5px 0;">Economy Plumbing Services</p>
                <p style="margin: 5px 0;">Austin & Marble Falls, TX</p>
                <p style="margin: 5px 0;">(512) 396-7811</p>
              </div>
            </body>
            </html>
          `,
        });

        console.log('[Portal Auth] Verification code email sent successfully');

        // Mask email for privacy (show first 2 chars and domain)
        const maskEmail = (email: string) => {
          const [localPart, domain] = email.split('@');
          if (!localPart || !domain) return email;
          const visibleChars = Math.min(2, localPart.length);
          const maskedLocal = localPart.substring(0, visibleChars) + '*'.repeat(Math.max(3, localPart.length - visibleChars));
          return `${maskedLocal}@${domain}`;
        };

        return NextResponse.json({
          success: true,
          message: `Verification code sent to ${maskEmail(contactValue)}! Please check your email.`,
          expiresIn: expiryMinutes * 60, // seconds
        });
      } catch (error) {
        console.error('[Portal Auth] Email send failed:', error);
        return NextResponse.json(
          { error: 'Failed to send verification code email' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
  } catch (error: any) {
    console.error('[Portal Auth] Send code error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to send verification code',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
