// Client-side phone number detection for Astro pages
// This replicates the React PhoneConfigContext logic for static pages

interface PhoneConfig {
  display: string;
  tel: string;
}

interface TrackingNumber {
  id: string;
  channelKey: string;
  channelName: string;
  displayNumber: string;
  rawNumber: string;
  telLink: string;
  detectionRules: string;
  isActive: boolean;
  isDefault: boolean;
}

interface DetectionRules {
  isDefault?: boolean;
  urlParams?: string[];
  utmSources?: string[];
  referrerIncludes?: string[];
}

const DEFAULT_PHONE: PhoneConfig = {
  display: '(512) 368-9159',
  tel: 'tel:+15123689159'
};

const MARBLE_FALLS_PHONE: PhoneConfig = {
  display: '(830) 460-3565',
  tel: 'tel:+18304603565'
};

const COOKIE_NAME = 'traffic_source';
const COOKIE_DAYS = 90;

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function detectTrafficSource(trackingNumbers: TrackingNumber[]): TrackingNumber | null {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer.toLowerCase();
  const utmSource = urlParams.get('utm_source')?.toLowerCase();

  for (const number of trackingNumbers) {
    if (number.isDefault) continue;

    try {
      const rules: DetectionRules = JSON.parse(number.detectionRules);

      if (rules.urlParams) {
        for (const param of rules.urlParams) {
          if (urlParams.has(param)) {
            return number;
          }
        }
      }

      if (rules.utmSources && utmSource) {
        if (rules.utmSources.some(source => source.toLowerCase() === utmSource)) {
          return number;
        }
      }

      if (rules.referrerIncludes && referrer) {
        if (rules.referrerIncludes.some(pattern => referrer.includes(pattern.toLowerCase()))) {
          return number;
        }
      }
    } catch (error) {
      console.error(`Error parsing detection rules for ${number.channelKey}:`, error);
    }
  }

  return null;
}

function getPhoneNumberFromTracking(trackingNumbers: TrackingNumber[]): PhoneConfig {
  const detected = detectTrafficSource(trackingNumbers);
  
  if (detected) {
    setCookie(COOKIE_NAME, detected.channelKey, COOKIE_DAYS);
    return {
      display: detected.displayNumber,
      tel: detected.telLink
    };
  }

  const sourceCookie = getCookie(COOKIE_NAME);
  if (sourceCookie) {
    const cookieNumber = trackingNumbers.find(n => n.channelKey === sourceCookie);
    if (cookieNumber) {
      return {
        display: cookieNumber.displayNumber,
        tel: cookieNumber.telLink
      };
    }
  }

  const defaultNumber = trackingNumbers.find(n => n.isDefault);
  if (defaultNumber) {
    return {
      display: defaultNumber.displayNumber,
      tel: defaultNumber.telLink
    };
  }

  return DEFAULT_PHONE;
}

// Initialize phone numbers on page load
export async function initializePhoneNumbers() {
  try {
    const response = await fetch('/api/tracking-numbers');
    if (!response.ok) throw new Error('Failed to fetch tracking numbers');
    
    const data = await response.json();
    const trackingNumbers: TrackingNumber[] = data.trackingNumbers || [];
    
    if (trackingNumbers.length === 0) {
      console.warn('[PhoneDetection] No tracking numbers configured, using defaults');
      setPhoneNumbers(DEFAULT_PHONE, MARBLE_FALLS_PHONE);
      return;
    }

    const phoneConfig = getPhoneNumberFromTracking(trackingNumbers);
    
    // Set window globals for scheduler fallback
    window.__PHONE_CONFIG__ = phoneConfig;
    window.__MARBLE_FALLS_PHONE_CONFIG__ = MARBLE_FALLS_PHONE;
    
    // Update all phone number elements in the page
    updatePhoneElements(phoneConfig);
    
  } catch (error) {
    console.error('[PhoneDetection] Error initializing phone numbers:', error);
    setPhoneNumbers(DEFAULT_PHONE, MARBLE_FALLS_PHONE);
  }
}

function setPhoneNumbers(austin: PhoneConfig, marbleFalls: PhoneConfig) {
  window.__PHONE_CONFIG__ = austin;
  window.__MARBLE_FALLS_PHONE_CONFIG__ = marbleFalls;
  updatePhoneElements(austin);
}

function updatePhoneElements(phoneConfig: PhoneConfig) {
  // Update all phone links with data-phone="austin"
  document.querySelectorAll('[data-phone="austin"]').forEach(el => {
    if (el instanceof HTMLAnchorElement) {
      el.href = phoneConfig.tel;
      el.textContent = phoneConfig.display;
    }
  });
  
  // Update phone display elements
  document.querySelectorAll('[data-phone-display="austin"]').forEach(el => {
    el.textContent = phoneConfig.display;
  });
}

// Type declarations for window globals
declare global {
  interface Window {
    __PHONE_CONFIG__: PhoneConfig;
    __MARBLE_FALLS_PHONE_CONFIG__: PhoneConfig;
  }
}
