import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { phoneLoginLookups, portalVerifications } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.substring(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const { lookupToken } = await req.json();

    if (!lookupToken) {
      return NextResponse.json(
        { error: "Lookup token required" },
        { status: 400 }
      );
    }

    console.log("[Portal Phone Auth] Sending magic link for token:", lookupToken);

    // Retrieve the stored lookup (server-side only)
    const lookups = await db
      .select()
      .from(phoneLoginLookups)
      .where(
        and(
          eq(phoneLoginLookups.lookupToken, lookupToken),
          sql`${phoneLoginLookups.expiresAt} > NOW()`
        )
      )
      .limit(1);

    if (lookups.length === 0) {
      return NextResponse.json(
        { error: "Lookup expired or invalid. Please try again." },
        { status: 404 }
      );
    }

    const lookup = lookups[0];
    const { email, customerId } = lookup;

    // Generate magic link token
    const uuid = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store verification
    await db.insert(portalVerifications).values({
      customerIds: [customerId],
      contactValue: email,
      verificationType: 'email',
      code: uuid,
      expiresAt,
    });

    // Send magic link email
    const { sendEmail } = await import('@/server/email');
    
    // Get the proper domain - Replit automatically sets 'host' header correctly
    const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'plumbersthatcare.com';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const magicLink = `${protocol}://${host}/customer-portal?token=${uuid}`;
    
    await sendEmail({
      to: email,
      subject: 'Your Customer Portal Access Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8;">Customer Portal Access</h2>
          <p>Click the link below to access your customer portal:</p>
          <p style="margin: 30px 0;">
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #1d4ed8; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Your Portal</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this link, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Economy Plumbing Services<br>
            Austin, Texas
          </p>
        </div>
      `,
      tags: [
        { name: 'type', value: 'portal-magic-link' },
        { name: 'phone-login', value: 'true' },
      ],
    });

    console.log("[Portal Phone Auth] Magic link sent successfully");

    return NextResponse.json({ 
      success: true,
      message: `Magic link sent to ${maskEmail(email)}`,
      maskedEmail: maskEmail(email),
    });
  } catch (error: any) {
    console.error("[Portal Phone Auth] Send link error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
