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
