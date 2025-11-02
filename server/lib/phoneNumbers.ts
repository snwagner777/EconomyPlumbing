import { storage } from '@/server/storage';

export interface PhoneConfig {
  display: string;
  tel: string;
}

// Default phone numbers - always available for SSR
export const DEFAULT_AUSTIN_PHONE: PhoneConfig = {
  display: '(512) 368-9159',
  tel: 'tel:+15123689159'
};

export const DEFAULT_MARBLE_FALLS_PHONE: PhoneConfig = {
  display: '(830) 460-3565',
  tel: 'tel:+18304603565'
};

/**
 * Get default phone number for server-side rendering
 * This ensures phone numbers are in the HTML for Google
 */
export async function getDefaultPhoneNumber(): Promise<PhoneConfig> {
  try {
    const defaultNumber = await storage.getDefaultTrackingNumber();
    if (defaultNumber) {
      return {
        display: defaultNumber.displayNumber,
        tel: defaultNumber.telLink,
      };
    }
  } catch (error) {
    console.error('[PhoneNumbers] Error fetching default tracking number:', error);
  }
  
  return DEFAULT_AUSTIN_PHONE;
}

/**
 * Get both phone numbers for SSR
 */
export async function getPhoneNumbers(): Promise<{
  austin: PhoneConfig;
  marbleFalls: PhoneConfig;
}> {
  const austin = await getDefaultPhoneNumber();
  return {
    austin,
    marbleFalls: DEFAULT_MARBLE_FALLS_PHONE,
  };
}
