import { NextRequest, NextResponse } from 'next/server';

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
    const valid = otpStore.verifyOTP(contact, code);
    
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid or expired code" },
        { status: 401 }
      );
    }

    console.log(`[Scheduler OTP] ✅ Verified ${contact}`);
    
    // Return success - client can now proceed with authenticated scheduler
    return NextResponse.json({ 
      verified: true,
      message: "Verification successful!",
      contact
    });
  } catch (error: any) {
    console.error('[Scheduler OTP] Error verifying code:', error);
    return NextResponse.json(
      { message: "Error verifying code: " + error.message },
      { status: 500 }
    );
  }
}
