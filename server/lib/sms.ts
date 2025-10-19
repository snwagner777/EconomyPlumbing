import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing required Twilio environment variables');
}

const client = twilio(accountSid, authToken);

export interface SendSMSOptions {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SendSMSOptions): Promise<void> {
  try {
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log(`SMS sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send SMS');
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
