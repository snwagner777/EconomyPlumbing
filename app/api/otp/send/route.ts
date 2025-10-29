import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get Twilio SMS service
    const { getTwilioSMS } = await import('@/server/lib/twilioSMS');
    const twilioSMS = getTwilioSMS();
    
    if (!twilioSMS) {
      return NextResponse.json(
        { message: "SMS service not available. Please call us instead." },
        { status: 503 }
      );
    }

    // Create OTP code
    const { getOTPStore } = await import('@/server/lib/otpStore');
    const otpStore = getOTPStore();
    const code = otpStore.createOTP(phoneNumber);
    
    if (!code) {
      return NextResponse.json(
        { message: "Please wait a minute before requesting another code" },
        { status: 429 }
      );
    }

    // Send via SMS
    const sent = await twilioSMS.sendOTP(phoneNumber, code);
    
    if (!sent) {
      return NextResponse.json(
        { message: "Failed to send verification code. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[OTP] Sent code to ${phoneNumber}`);
    return NextResponse.json({ message: "Verification code sent!" });
  } catch (error: any) {
    console.error('[OTP] Error sending code:', error);
    return NextResponse.json(
      { message: "Error sending code: " + error.message },
      { status: 500 }
    );
  }
}
