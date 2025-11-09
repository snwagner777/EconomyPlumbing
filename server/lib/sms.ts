/**
 * SMS Service - SimpleTexting Integration
 * 
 * Provider: SimpleTexting API v2
 * Documentation: https://api-doc.simpletexting.com/
 * 
 * Environment Variables Required:
 * - SIMPLETEXTING_API_TOKEN: Your SimpleTexting API token (Bearer auth)
 * - SIMPLETEXTING_PHONE_NUMBER: Your SimpleTexting phone number (sender)
 */

const simpleTextingToken = process.env.SIMPLETEXTING_API_TOKEN;
const simpleTextingPhoneNumber = process.env.SIMPLETEXTING_PHONE_NUMBER;

const isSimpleTextingConfigured = !!(simpleTextingToken && simpleTextingPhoneNumber);

if (!isSimpleTextingConfigured) {
  console.warn('[SMS] SimpleTexting not configured. SMS functionality will be disabled.');
  console.warn('[SMS] Required: SIMPLETEXTING_API_TOKEN and SIMPLETEXTING_PHONE_NUMBER');
} else {
  console.log('[SMS] Using SimpleTexting for SMS delivery');
  console.log('[SMS] Sender number:', simpleTextingPhoneNumber);
}

export interface SendSMSOptions {
  to: string;
  message: string;
}

/**
 * Send SMS via SimpleTexting API
 * 
 * API Endpoint: POST https://api-app2.simpletexting.com/v2/api/messages
 * Authentication: Bearer token
 * 
 * @param to - Recipient phone number (10 digits, no formatting)
 * @param message - Message text content
 */
async function sendViaSimpleTexting({ to, message }: SendSMSOptions): Promise<void> {
  if (!isSimpleTextingConfigured) {
    throw new Error('SimpleTexting not configured');
  }

  // Normalize phone number - SimpleTexting expects 10 digits (no +1 prefix)
  let normalizedPhone = to.replace(/\D/g, '');
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) {
    normalizedPhone = normalizedPhone.substring(1);
  }
  
  console.log('[SimpleTexting] Sending SMS:');
  console.log('  From:', simpleTextingPhoneNumber);
  console.log('  To:', normalizedPhone);
  console.log('  Message length:', message.length, 'characters');
  
  try {
    const response = await fetch('https://api-app2.simpletexting.com/v2/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${simpleTextingToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactPhone: normalizedPhone,
        accountPhone: simpleTextingPhoneNumber,
        mode: 'AUTO',
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[SimpleTexting] API error:', error);
      throw new Error(`SimpleTexting API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[SimpleTexting] ✅ SMS sent successfully to ${normalizedPhone}`);
    console.log('[SimpleTexting] Response:', result);
  } catch (error) {
    console.error('[SimpleTexting] Failed to send SMS:', error);
    throw new Error('Failed to send SMS via SimpleTexting');
  }
}

export async function sendSMS({ to, message }: SendSMSOptions): Promise<void> {
  if (!isSimpleTextingConfigured) {
    console.warn('[SMS] SimpleTexting not configured - skipping SMS to:', to);
    throw new Error('SMS provider not configured. Please set SIMPLETEXTING_API_TOKEN and SIMPLETEXTING_PHONE_NUMBER environment variables.');
  }
  
  await sendViaSimpleTexting({ to, message });
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
