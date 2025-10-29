import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, code } = await req.json();
    
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { message: "Phone number and code are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const { getOTPStore } = await import('@/server/lib/otpStore');
    const otpStore = getOTPStore();
    const valid = otpStore.verifyOTP(phoneNumber, code);
    
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid or expired code" },
        { status: 401 }
      );
    }

    console.log(`[OTP] ✅ Verified for ${phoneNumber}`);
    
    // Return success - client can now proceed with customer lookup
    return NextResponse.json({ 
      verified: true,
      message: "Phone number verified!" 
    });
  } catch (error: any) {
    console.error('[OTP] Error verifying code:', error);
    return NextResponse.json(
      { message: "Error verifying code: " + error.message },
      { status: 500 }
    );
  }
}
