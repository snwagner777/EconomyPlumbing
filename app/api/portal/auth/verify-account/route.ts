import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { portalVerifications } from '@shared/schema';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    console.log("[Portal Auth] Verifying account:", customerId);

    // Get customer from ServiceTitan to verify it exists
    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();
    
    const customer = await serviceTitan.getCustomer(parseInt(customerId));
    if (!customer) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Get customer contacts to find email/phone
    const contacts = await serviceTitan.getCustomerContacts(parseInt(customerId));
    
    // Find email or phone for verification
    const emailContact = contacts.find((c: any) => c.type?.toLowerCase().includes('email'));
    const phoneContact = contacts.find((c: any) => 
      c.type?.toLowerCase().includes('phone') || c.type?.toLowerCase().includes('mobile')
    );

    let verificationType: 'sms' | 'email' = 'email';
    let contactValue: string;
    
    if (phoneContact?.value) {
      verificationType = 'sms';
      contactValue = phoneContact.value;
    } else if (emailContact?.value) {
      verificationType = 'email';
      contactValue = emailContact.value;
    } else {
      return NextResponse.json({ 
        error: "No email or phone found for this account. Please contact us directly." 
      }, { status: 400 });
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const uuid = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (verificationType === 'sms' ? 15 * 60 * 1000 : 60 * 60 * 1000));

    // Store verification
    await db.insert(portalVerifications).values({
      customerIds: [parseInt(customerId)],
      contactValue,
      verificationType,
      code: verificationType === 'sms' ? code : uuid,
      expiresAt,
    });

    // Send verification
    if (verificationType === 'sms') {
      const { sendSMS } = await import('@/server/lib/sms');
      await sendSMS({
        to: contactValue,
        message: `Your Economy Plumbing customer portal verification code is: ${code}. Valid for 15 minutes.`,
      });
      console.log("[Portal Auth] SMS sent to", contactValue);
      return NextResponse.json({ 
        message: `A 6-digit verification code has been sent to ${contactValue.replace(/.(?=.{4})/g, '*')}`,
        verificationType: 'sms'
      });
    } else {
      const { sendEmail } = await import('@/server/email');
      
      // Get the proper domain - Replit automatically sets 'host' header correctly
      const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'plumbersthatcare.com';
      const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      const magicLink = `${protocol}://${host}/customer-portal?token=${uuid}`;
      
      await sendEmail({
        to: contactValue,
        subject: 'Your Customer Portal Access Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Customer Portal Access</h2>
            <p>Click the link below to access your customer portal:</p>
            <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #1d4ed8; color: white; text-decoration: none; border-radius: 5px;">Access Portal</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log("[Portal Auth] Email sent to", contactValue);
      return NextResponse.json({ 
        message: `A verification link has been sent to ${contactValue.replace(/(.{3})(.*)(@.*)/, '$1***$3')}`,
        verificationType: 'email'
      });
    }
  } catch (error: any) {
    console.error("[Portal Auth] Account verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify account" },
      { status: 500 }
    );
  }
}
