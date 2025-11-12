import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { contact, type } = await req.json();
    
    if (!contact || !type) {
      return NextResponse.json(
        { message: "Contact and type are required" },
        { status: 400 }
      );
    }

    if (type !== 'phone' && type !== 'email') {
      return NextResponse.json(
        { message: "Type must be 'phone' or 'email'" },
        { status: 400 }
      );
    }

    // Get OTP store
    const { getOTPStore } = await import('@/server/lib/otpStore');
    const otpStore = getOTPStore();
    
    // Create OTP code
    const code = otpStore.createOTP(contact);
    
    if (!code) {
      return NextResponse.json(
        { message: "Please wait a minute before requesting another code" },
        { status: 429 }
      );
    }

    // Send via SMS or Email
    if (type === 'phone') {
      // Send SMS
      const { getTwilioSMS } = await import('@/server/lib/twilioSMS');
      const twilioSMS = getTwilioSMS();
      
      if (!twilioSMS) {
        return NextResponse.json(
          { message: "SMS service not available. Please use email verification instead." },
          { status: 503 }
        );
      }

      const sent = await twilioSMS.sendOTP(contact, code);
      
      if (!sent) {
        return NextResponse.json(
          { message: "Failed to send SMS verification code. Please try again." },
          { status: 500 }
        );
      }

      console.log(`[Scheduler OTP] Sent SMS code to ${contact}`);
      return NextResponse.json({ 
        message: "Verification code sent via SMS!",
        method: 'sms'
      });
    } else {
      // Send Email
      const { sendEmail } = await import('@/server/email');
      
      try {
        await sendEmail({
          to: contact,
          subject: 'Your Economy Plumbing Services Verification Code',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #0284c7; margin-top: 0;">Verify Your Email</h2>
                  
                  <p style="font-size: 16px; line-height: 1.6;">
                    Please use the following verification code to complete your appointment booking:
                  </p>
                  
                  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <p style="font-size: 32px; font-weight: bold; color: #0284c7; letter-spacing: 4px; margin: 0; font-family: monospace;">
                      ${code}
                    </p>
                  </div>
                  
                  <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                    This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
                  </p>
                  
                  <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    Economy Plumbing Services<br/>
                    Licensed & Insured • Family Owned • Serving Austin Since 1995
                  </p>
                </div>
              </body>
            </html>
          `,
          tags: [
            { name: 'type', value: 'scheduler-otp' }
          ]
        });

        console.log(`[Scheduler OTP] Sent email code to ${contact}`);
        return NextResponse.json({ 
          message: "Verification code sent via email!",
          method: 'email'
        });
      } catch (error: any) {
        console.error('[Scheduler OTP] Email send failed:', error);
        return NextResponse.json(
          { message: "Failed to send email verification code. Please try SMS instead." },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('[Scheduler OTP] Error sending code:', error);
    return NextResponse.json(
      { message: "Error sending code: " + error.message },
      { status: 500 }
    );
  }
}
