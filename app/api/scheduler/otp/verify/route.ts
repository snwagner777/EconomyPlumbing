import { NextRequest, NextResponse } from 'next/server';
import { mintSchedulerSession } from '@/server/lib/schedulerSession';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { contact, code } = await req.json();
    
    if (!contact || !code) {
      return NextResponse.json(
        { message: "Contact and code are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const { getOTPStore } = await import('@/server/lib/otpStore');
    const otpStore = getOTPStore();
    const verificationResult = otpStore.verifyOTP(contact, code);
    
    if (!verificationResult) {
      return NextResponse.json(
        { message: "Invalid or expired code" },
        { status: 401 }
      );
    }

    const { contact: verifiedContact, method } = verificationResult;
    console.log(`[Scheduler OTP] ✅ Verified ${verifiedContact} via ${method}`);
    
    // Look up customer ID from our database (if they exist)
    let customerId: number | null = null;
    try {
      if (method === 'phone') {
        const normalizedPhone = verifiedContact.replace(/\D/g, '');
        const customer = await db.query.customersXlsx.findFirst({
          where: eq(customersXlsx.phone, normalizedPhone)
        });
        customerId = customer?.id || null; // id is the ServiceTitan customer ID
      } else {
        const customer = await db.query.customersXlsx.findFirst({
          where: eq(customersXlsx.email, verifiedContact.toLowerCase())
        });
        customerId = customer?.id || null; // id is the ServiceTitan customer ID
      }
    } catch (error) {
      console.error('[Scheduler OTP] Error looking up customer:', error);
      // Continue without customer ID - they might be creating a new account
    }
    
    // Mint a scheduler session token
    const session = mintSchedulerSession(verifiedContact, method, customerId);
    
    console.log(`[Scheduler OTP] 🎟️  Minted session token for customer ${customerId || 'new'}`);
    
    // Return session token and metadata (no PII)
    return NextResponse.json({ 
      verified: true,
      message: "Verification successful!",
      session: {
        token: session.token,
        verificationMethod: session.verificationMethod,
        verifiedAt: session.verifiedAt,
        customerId: session.customerId,
        expiresAt: session.expiresAt,
      }
    });
  } catch (error: any) {
    console.error('[Scheduler OTP] Error verifying code:', error);
    return NextResponse.json(
      { message: "Error verifying code: " + error.message },
      { status: 500 }
    );
  }
}
