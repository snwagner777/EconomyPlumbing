import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const zoomApiKey = process.env.ZOOM_PHONE_API_KEY;
const zoomPhoneNumber = process.env.ZOOM_PHONE_NUMBER;

const isTwilioConfigured = !!(accountSid && authToken && twilioPhoneNumber);
const isZoomConfigured = !!(zoomApiKey && zoomPhoneNumber);

if (!isZoomConfigured && !isTwilioConfigured) {
  console.warn('[SMS] No SMS provider configured. SMS functionality will be disabled.');
} else if (isZoomConfigured) {
  console.log('[SMS] Using Zoom Phone for SMS delivery');
} else {
  console.log('[SMS] Using Twilio for SMS delivery');
}

const twilioClient = isTwilioConfigured ? twilio(accountSid, authToken) : null;

export interface SendSMSOptions {
  to: string;
  message: string;
}

async function sendViaZoom({ to, message }: SendSMSOptions): Promise<void> {
  console.log('[Zoom Phone] Sending SMS:');
  console.log('  From:', zoomPhoneNumber);
  console.log('  To:', to);
  
  try {
    const response = await fetch('https://api.zoom.us/v2/phone/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${zoomApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        from: zoomPhoneNumber,
        message: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Zoom Phone] API error:', error);
      throw new Error(`Zoom Phone API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Zoom Phone] SMS sent successfully to ${to}:`, result);
  } catch (error) {
    console.error('[Zoom Phone] Failed to send SMS:', error);
    throw new Error('Failed to send SMS via Zoom Phone');
  }
}

async function sendViaTwilio({ to, message }: SendSMSOptions): Promise<void> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }
  
  console.log('[Twilio] Sending SMS:');
  console.log('  From:', twilioPhoneNumber);
  console.log('  To:', to);
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log(`[Twilio] SMS sent successfully to ${to}`);
  } catch (error) {
    console.error('[Twilio] Failed to send SMS:', error);
    throw new Error('Failed to send SMS via Twilio');
  }
}

export async function sendSMS({ to, message }: SendSMSOptions): Promise<void> {
  if (!isZoomConfigured && !isTwilioConfigured) {
    console.warn('[SMS] No SMS provider configured - skipping SMS to:', to);
    throw new Error('No SMS provider configured. Please set either Zoom Phone or Twilio environment variables.');
  }
  
  if (isZoomConfigured) {
    await sendViaZoom({ to, message });
  } else {
    await sendViaTwilio({ to, message });
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(phoneNumber: string, otp: string): Promise<void> {
  const message = `Your Economy Plumbing verification code is: ${otp}. This code will expire in 10 minutes.`;
  await sendSMS({ to: phoneNumber, message });
}

export async function sendReferralNotification(
  phoneNumber: string,
  referrerName: string,
  referralCode: string
): Promise<void> {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://economyplumbing.repl.co' 
    : 'http://localhost:5000';
  
  const message = `${referrerName} thinks you could use Economy Plumbing! Get $25 off your first service of $200 or more. Schedule now: ${baseUrl}/ref/${referralCode}`;
  
  await sendSMS({ to: phoneNumber, message });
}
