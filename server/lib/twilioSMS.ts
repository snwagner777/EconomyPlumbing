/**
 * Twilio SMS integration for sending OTP codes and notifications
 */

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

class TwilioSMS {
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  /**
   * Send an SMS message using Twilio API
   */
  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
      
      const body = new URLSearchParams({
        To: to,
        From: this.config.phoneNumber,
        Body: message
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            `${this.config.accountSid}:${this.config.authToken}`
          ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Twilio] SMS send failed:', error);
        return false;
      }

      const data = await response.json();
      console.log('[Twilio] ✅ SMS sent successfully:', data.sid);
      return true;
    } catch (error) {
      console.error('[Twilio] Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Send an OTP code via SMS
   */
  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your Economy Plumbing verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this message.`;
    
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send a referral notification to the referee
   */
  async sendReferralNotification(phoneNumber: string, referrerName: string): Promise<boolean> {
    const message = `Hi! ${referrerName} referred you to Economy Plumbing Services. We'd love to help with your plumbing needs!\n\nCall us: (512) 758-8956\nSchedule online: www.plumbersthatcare.com\n\nMention this referral when booking!`;
    
    return this.sendSMS(phoneNumber, message);
  }
}

// Singleton instance
let twilioSMS: TwilioSMS | null = null;

export function getTwilioSMS(): TwilioSMS | null {
  if (!twilioSMS) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('[Twilio] Credentials not configured - SMS features disabled');
      return null;
    }

    twilioSMS = new TwilioSMS({
      accountSid,
      authToken,
      phoneNumber
    });
  }

  return twilioSMS;
}
