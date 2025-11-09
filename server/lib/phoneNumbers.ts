import { storage } from '@/server/storage';

export interface PhoneConfig {
  display: string;
  tel: string;
}

interface TrackingNumber {
  id: string;
  channelKey: string;
  displayNumber: string;
  telLink: string;
  detectionRules: string;
  isActive: boolean;
  isDefault: boolean;
}

interface DetectionRules {
  isDefault?: boolean;
  patterns?: string[];
  urlParams?: string[];
  utmSources?: string[];
  referrerIncludes?: string[];
}

// Default phone numbers from environment variables
// These are ultimate fallbacks when database tracking numbers aren't available
// Format: NEXT_PUBLIC_DEFAULT_AUSTIN_PHONE=(512) 368-9159
function normalizePhoneNumber(phone: string, label: string): PhoneConfig {
  // Extract only digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validate it's a 10-digit or 11-digit number
  let digits = cleanPhone;
  if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    // Remove leading 1 (country code)
    digits = cleanPhone.substring(1);
  } else if (cleanPhone.length !== 10) {
    throw new Error(`[PhoneNumbers] ${label} must be 10 digits (or 11 with leading 1). Got: ${phone} (${cleanPhone.length} digits)`);
  }
  
  return {
    display: phone, // Keep original formatting for display
    tel: `tel:+1${digits}` // Always format as +1XXXXXXXXXX
  };
}

function getDefaultAustinPhone(): PhoneConfig {
  const envPhone = process.env.NEXT_PUBLIC_DEFAULT_AUSTIN_PHONE;
  if (!envPhone) {
    const errorMsg = '[PhoneNumbers] CRITICAL: NEXT_PUBLIC_DEFAULT_AUSTIN_PHONE not set. Configure in .env.local or admin panel tracking numbers.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return normalizePhoneNumber(envPhone, 'NEXT_PUBLIC_DEFAULT_AUSTIN_PHONE');
}

function getDefaultMarbleFallsPhone(): PhoneConfig {
  const envPhone = process.env.NEXT_PUBLIC_DEFAULT_MARBLE_FALLS_PHONE;
  if (!envPhone) {
    const errorMsg = '[PhoneNumbers] CRITICAL: NEXT_PUBLIC_DEFAULT_MARBLE_FALLS_PHONE not set. Configure in .env.local or admin panel tracking numbers.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return normalizePhoneNumber(envPhone, 'NEXT_PUBLIC_DEFAULT_MARBLE_FALLS_PHONE');
}

// Eager initialization - fails fast at startup if env vars missing
// Plain objects are serializable for Next.js RSC (React Server Components)
export const DEFAULT_AUSTIN_PHONE: PhoneConfig = getDefaultAustinPhone();
export const DEFAULT_MARBLE_FALLS_PHONE: PhoneConfig = getDefaultMarbleFallsPhone();

/**
 * Server-side tracking number detection based on URL parameters
 * This runs during SSR so crawlers see the correct tracking number
 */
function detectTrackingNumberFromURL(
  trackingNumbers: TrackingNumber[],
  searchParams: URLSearchParams
): TrackingNumber | null {
  const utmSource = searchParams.get('utm_source')?.toLowerCase();
  const utmCampaign = searchParams.get('utm_campaign')?.toLowerCase();
  const utmMedium = searchParams.get('utm_medium')?.toLowerCase();

  // Check each tracking number's detection rules
  for (const number of trackingNumbers) {
    if (number.isDefault || !number.isActive) continue;

    try {
      const rules: DetectionRules = JSON.parse(number.detectionRules);

      // Check URL parameters (e.g., utm_campaign=review-request)
      if (rules.urlParams) {
        for (const param of rules.urlParams) {
          if (searchParams.has(param)) {
            return number;
          }
        }
      }

      // Check UTM source
      if (rules.utmSources && utmSource) {
        if (rules.utmSources.some(source => source.toLowerCase() === utmSource)) {
          return number;
        }
      }
    } catch (error) {
      console.error(`[PhoneNumbers SSR] Error parsing detection rules for ${number.channelKey}:`, error);
    }
  }

  return null;
}

/**
 * Get phone number for server-side rendering with UTM-based tracking
 * This ensures the correct tracking number appears in HTML for SEO
 * 
 * @param searchParams - URL search parameters from Next.js page
 */
export async function getPhoneNumberForSSR(searchParams?: URLSearchParams): Promise<PhoneConfig> {
  try {
    // Fetch all active tracking numbers
    const trackingNumbers = await storage.getAllTrackingNumbers();
    
    if (!trackingNumbers || trackingNumbers.length === 0) {
      return DEFAULT_AUSTIN_PHONE;
    }

    // If we have URL parameters, try to detect the appropriate tracking number
    if (searchParams && searchParams.size > 0) {
      const detected = detectTrackingNumberFromURL(trackingNumbers, searchParams);
      if (detected) {
        return {
          display: detected.displayNumber,
          tel: detected.telLink,
        };
      }
    }

    // Fall back to default tracking number from database
    const defaultNumber = trackingNumbers.find(n => n.isDefault && n.isActive);
    if (defaultNumber) {
      return {
        display: defaultNumber.displayNumber,
        tel: defaultNumber.telLink,
      };
    }
  } catch (error) {
    console.error('[PhoneNumbers SSR] Error fetching tracking numbers:', error);
  }
  
  // Ultimate fallback
  return DEFAULT_AUSTIN_PHONE;
}

/**
 * Get both phone numbers for SSR (Austin dynamically resolves, Marble Falls is static)
 * 
 * @param searchParams - URL search parameters from Next.js page
 */
export async function getPhoneNumbers(searchParams?: URLSearchParams): Promise<{
  austin: PhoneConfig;
  marbleFalls: PhoneConfig;
}> {
  const austin = await getPhoneNumberForSSR(searchParams);
  return {
    austin,
    marbleFalls: DEFAULT_MARBLE_FALLS_PHONE,
  };
}

/**
 * Legacy function for backward compatibility
 */
export async function getDefaultPhoneNumber(): Promise<PhoneConfig> {
  return getPhoneNumberForSSR();
}
