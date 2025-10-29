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

    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();

    // Search ONLY in local synced cache - DO NOT create customers on-demand
    const searchValue = contactValue;
    const customerIds = await serviceTitan.searchLocalCustomer(searchValue);

    if (customerIds.length === 0) {
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

    console.log(
      `[Portal Auth] Found ${customerIds.length} customer account(s) in cache:`,
      customerIds
    );

    // Generate verification code or token
    const code =
      verificationType === 'sms'
        ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
        : crypto.randomUUID(); // UUID token for email magic link

    // Set expiry time (10 min for SMS, 1 hour for email)
    const expiryMinutes = verificationType === 'sms' ? 10 : 60;
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
      // Send email magic link
      try {
        const { sendEmail } = await import('@/server/email');
        const magicLink = `${request.nextUrl.protocol}//${request.nextUrl.host}/customer-portal?token=${code}`;

        await sendEmail({
          to: contactValue,
          subject: 'Access Your Customer Portal - Economy Plumbing',
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
                <h2>Access Your Customer Portal</h2>
                <p>Click the button below to securely access your customer portal:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Access Portal
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="background-color: #fff; padding: 10px; border-left: 4px solid #0066cc; word-break: break-all; font-size: 13px;">
                  ${magicLink}
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in ${expiryMinutes} minutes. If you didn't request this link, please ignore this email.</p>
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

        console.log('[Portal Auth] Magic link email sent successfully');

        return NextResponse.json({
          success: true,
          message: `Magic link sent to ${contactValue}! Please check your email.`,
          expiresIn: expiryMinutes * 60, // seconds
        });
      } catch (error) {
        console.error('[Portal Auth] Email send failed:', error);
        return NextResponse.json(
          { error: 'Failed to send magic link email' },
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
