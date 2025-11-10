import type { InsertSmsMessage, InsertSimpleTextingContact } from '../../shared/schema';

interface SimpleTextingConfig {
  apiToken: string;
  phoneNumber: string;
}

interface SendSmsParams {
  to: string;
  message: string;
  subject?: string;
}

interface SimpleTextingResponse {
  id: string;
  subject?: string;
  text: string;
  contactPhone: string;
  accountPhone: string;
  directionType: 'MO' | 'MT';
  timestamp: string;
  referenceType: string;
  category: 'SMS' | 'MMS';
  mediaItems?: string[];
}

interface ContactSyncParams {
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class SimpleTextingClient {
  private readonly baseUrl = 'https://api-app2.simpletexting.com/v2';
  private readonly apiToken: string;
  private readonly phoneNumber: string;

  constructor(config: SimpleTextingConfig) {
    if (!config.apiToken) {
      throw new Error('SimpleTexting API token is required');
    }
    if (!config.phoneNumber) {
      throw new Error('SimpleTexting phone number is required');
    }
    this.apiToken = config.apiToken;
    this.phoneNumber = config.phoneNumber;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    };
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return cleaned;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.substring(1);
    }
    
    return cleaned;
  }

  async sendSms(params: SendSmsParams): Promise<SimpleTextingResponse> {
    const normalizedTo = this.normalizePhone(params.to);
    const normalizedFrom = this.normalizePhone(this.phoneNumber);

    if (normalizedTo.length !== 10) {
      throw new Error(`Invalid recipient phone number: ${params.to}`);
    }

    const body = new URLSearchParams({
      accountPhone: normalizedFrom,
      contactPhone: normalizedTo,
      text: params.message,
    });

    if (params.subject) {
      body.append('subject', params.subject);
    }

    const response = await fetch(`${this.baseUrl}/api/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SimpleTexting API error (${response.status}): ${errorText}`);
    }

    const data: SimpleTextingResponse = await response.json();
    return data;
  }

  async syncContact(params: ContactSyncParams): Promise<{ success: boolean; contactId?: string }> {
    const normalizedPhone = this.normalizePhone(params.phone);

    if (normalizedPhone.length !== 10) {
      throw new Error(`Invalid phone number: ${params.phone}`);
    }

    const body = new URLSearchParams({
      phone: normalizedPhone,
    });

    if (params.firstName) body.append('firstName', params.firstName);
    if (params.lastName) body.append('lastName', params.lastName);
    if (params.email) body.append('email', params.email);

    try {
      const response = await fetch(`${this.baseUrl}/api/contacts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SimpleTexting contact sync failed (${response.status}):`, errorText);
        return { success: false };
      }

      const data = await response.json();
      return { success: true, contactId: data.id };
    } catch (error) {
      console.error('SimpleTexting contact sync error:', error);
      return { success: false };
    }
  }

  async getMessageStatus(messageId: string): Promise<SimpleTextingResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/messages/${messageId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching message status:', error);
      return null;
    }
  }
}

export function createSimpleTextingClient(): SimpleTextingClient {
  const apiToken = process.env.SIMPLETEXTING_API_TOKEN;
  const phoneNumber = process.env.SIMPLETEXTING_PHONE_NUMBER;

  if (!apiToken || !phoneNumber) {
    throw new Error('SimpleTexting credentials not configured. Please set SIMPLETEXTING_API_TOKEN and SIMPLETEXTING_PHONE_NUMBER environment variables.');
  }

  return new SimpleTextingClient({
    apiToken,
    phoneNumber,
  });
}

export async function sendReferralSms(params: {
  recipientPhone: string;
  recipientName: string;
  referrerName: string;
  voucherCode: string;
  discountAmount: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Hi ${params.recipientName}! ${params.referrerName} referred you to Economy Plumbing Services. Use code ${params.voucherCode} for $${params.discountAmount} off your next service! Book now: https://plumbersthatcare.com/schedule-appointment`;
  
  try {
    const client = createSimpleTextingClient();

    const response = await client.sendSms({
      to: params.recipientPhone,
      message,
    });

    console.log(`[SimpleTexting] Referral SMS sent successfully: ${response.id}`);
    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error('[SimpleTexting] Error sending referral SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendReviewRequestSms(params: {
  recipientPhone: string;
  customerName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Hi ${params.customerName}! Thanks for choosing Economy Plumbing Services. We'd love to hear about your experience! Share your feedback here: https://plumbersthatcare.com/reviews`;
  
  try {
    const client = createSimpleTextingClient();

    const response = await client.sendSms({
      to: params.recipientPhone,
      message,
    });

    console.log(`[SimpleTexting] Review request SMS sent successfully: ${response.id}`);
    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error('[SimpleTexting] Error sending review request SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
