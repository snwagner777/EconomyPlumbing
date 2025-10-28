'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

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
  detectionRules: string; // JSON string
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface DetectionRules {
  isDefault?: boolean;
  patterns?: string[];
  urlParams?: string[];
  utmSources?: string[];
  referrerIncludes?: string[];
}

declare global {
  interface Window {
    __PHONE_CONFIG__: PhoneConfig;
    __MARBLE_FALLS_PHONE_CONFIG__: PhoneConfig;
  }
}

const DEFAULT_PHONE: PhoneConfig = {
  display: '(512) 368-9159',
  tel: 'tel:+15123689159'
};

const MARBLE_FALLS_PHONE: PhoneConfig = {
  display: '(830) 460-3565',
  tel: 'tel:+18304603565'
};

const PhoneConfigContext = createContext<PhoneConfig>(DEFAULT_PHONE);

// Cookie helper functions
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

// Detect traffic source from URL and referrer
function detectTrafficSource(trackingNumbers: TrackingNumber[]): TrackingNumber | null {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer.toLowerCase();
  const utmSource = urlParams.get('utm_source')?.toLowerCase();

  // Check each tracking number's detection rules
  for (const number of trackingNumbers) {
    if (number.isDefault) continue; // Skip default, we'll use it as fallback

    try {
      const rules: DetectionRules = JSON.parse(number.detectionRules);

      // Check URL parameters
      if (rules.urlParams) {
        for (const param of rules.urlParams) {
          if (urlParams.has(param)) {
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

      // Check referrer
      if (rules.referrerIncludes && referrer) {
        if (rules.referrerIncludes.some(pattern => referrer.includes(pattern.toLowerCase()))) {
          return number;
        }
      }
    } catch (error) {
      console.error(`[PhoneConfig] Error parsing detection rules for ${number.channelKey}:`, error);
    }
  }

  return null;
}

function getPhoneNumberFromTracking(trackingNumbers: TrackingNumber[]): PhoneConfig {
  // PRIORITY 1: Try to detect from current URL/referrer (this should override cookie)
  const detected = detectTrafficSource(trackingNumbers);
  
  if (detected) {
    // Save to cookie for 90 days
    setCookie(COOKIE_NAME, detected.channelKey, COOKIE_DAYS);
    return {
      display: detected.displayNumber,
      tel: detected.telLink
    };
  }

  // PRIORITY 2: Check if we have a saved traffic source in cookie (fallback)
  const savedSource = getCookie(COOKIE_NAME);
  
  if (savedSource) {
    const savedNumber = trackingNumbers.find(n => n.channelKey === savedSource && n.isActive);
    if (savedNumber) {
      return {
        display: savedNumber.displayNumber,
        tel: savedNumber.telLink
      };
    }
  }

  // PRIORITY 3: Fallback to default number
  const defaultNumber = trackingNumbers.find(n => n.isDefault && n.isActive);
  if (defaultNumber) {
    return {
      display: defaultNumber.displayNumber,
      tel: defaultNumber.telLink
    };
  }

  // Ultimate fallback
  return DEFAULT_PHONE;
}

export function PhoneConfigProvider({ children }: { children: ReactNode }) {
  const location = usePathname() || '/';
  const [phoneConfig, setPhoneConfig] = useState<PhoneConfig>(() => {
    // Initialize window globals immediately to avoid race conditions
    if (!window.__PHONE_CONFIG__) {
      window.__PHONE_CONFIG__ = DEFAULT_PHONE;
    }
    if (!window.__MARBLE_FALLS_PHONE_CONFIG__) {
      window.__MARBLE_FALLS_PHONE_CONFIG__ = MARBLE_FALLS_PHONE;
    }
    return window.__PHONE_CONFIG__;
  });

  // Fetch tracking numbers from API
  const { data: trackingData, isLoading } = useQuery<{ trackingNumbers: TrackingNumber[] }>({
    queryKey: ['/api/tracking-numbers'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    // Only update if we have tracking numbers loaded
    if (!trackingData?.trackingNumbers || isLoading) {
      return;
    }

    // Get phone number based on current URL/cookies and tracking numbers
    const newConfig = getPhoneNumberFromTracking(trackingData.trackingNumbers);
    
    // Update both the window global (for legacy code) and React state
    window.__PHONE_CONFIG__ = newConfig;
    window.__MARBLE_FALLS_PHONE_CONFIG__ = MARBLE_FALLS_PHONE;
    setPhoneConfig(newConfig);
  }, [location, trackingData, isLoading]);

  return (
    <PhoneConfigContext.Provider value={phoneConfig}>
      {children}
    </PhoneConfigContext.Provider>
  );
}

export function usePhoneConfig(): PhoneConfig {
  return useContext(PhoneConfigContext);
}

export function useAustinPhone(): PhoneConfig {
  return usePhoneConfig();
}

export function useMarbleFallsPhone(): PhoneConfig {
  return MARBLE_FALLS_PHONE;
}
