"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  sortOrder: number;
}

interface DetectionRules {
  isDefault?: boolean;
  patterns?: string[];
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

const PhoneConfigContext = createContext<PhoneConfig>(DEFAULT_PHONE);
const MarbleFallsPhoneContext = createContext<PhoneConfig>(MARBLE_FALLS_PHONE);

const COOKIE_NAME = 'traffic_source';
const COOKIE_DAYS = 90;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function detectTrafficSource(trackingNumbers: TrackingNumber[]): TrackingNumber | null {
  if (typeof window === 'undefined') return null;
  
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
      console.error(`[PhoneConfig] Error parsing detection rules:`, error);
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

  const cookieSource = getCookie(COOKIE_NAME);
  if (cookieSource) {
    const matchingNumber = trackingNumbers.find(n => n.channelKey === cookieSource);
    if (matchingNumber) {
      return {
        display: matchingNumber.displayNumber,
        tel: matchingNumber.telLink
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

export function PhoneConfigProvider({ children }: { children: ReactNode }) {
  const [phoneConfig, setPhoneConfig] = useState<PhoneConfig>(DEFAULT_PHONE);
  const [marbleFallsConfig, setMarbleFallsConfig] = useState<PhoneConfig>(MARBLE_FALLS_PHONE);

  useEffect(() => {
    async function fetchTrackingNumbers() {
      try {
        const response = await fetch('/api/tracking-numbers');
        if (!response.ok) throw new Error('Failed to fetch tracking numbers');
        
        const data = await response.json();
        const trackingNumbers = data.trackingNumbers || [];
        
        const austinNumbers = trackingNumbers.filter((n: TrackingNumber) => 
          !n.channelKey.toLowerCase().includes('marblefalls') &&
          !n.channelKey.toLowerCase().includes('marble_falls')
        );
        
        const marbleFallsNumbers = trackingNumbers.filter((n: TrackingNumber) =>
          n.channelKey.toLowerCase().includes('marblefalls') ||
          n.channelKey.toLowerCase().includes('marble_falls')
        );

        const austinConfig = getPhoneNumberFromTracking(austinNumbers);
        const mfConfig = marbleFallsNumbers.length > 0 
          ? getPhoneNumberFromTracking(marbleFallsNumbers)
          : MARBLE_FALLS_PHONE;

        setPhoneConfig(austinConfig);
        setMarbleFallsConfig(mfConfig);

        if (typeof window !== 'undefined') {
          window.__PHONE_CONFIG__ = austinConfig;
          window.__MARBLE_FALLS_PHONE_CONFIG__ = mfConfig;
        }
      } catch (error) {
        console.error('[PhoneConfig] Error fetching tracking numbers:', error);
      }
    }

    fetchTrackingNumbers();
  }, []);

  return (
    <PhoneConfigContext.Provider value={phoneConfig}>
      <MarbleFallsPhoneContext.Provider value={marbleFallsConfig}>
        {children}
      </MarbleFallsPhoneContext.Provider>
    </PhoneConfigContext.Provider>
  );
}

export function usePhoneConfig() {
  return useContext(PhoneConfigContext);
}

export function useMarbleFallsPhone() {
  return useContext(MarbleFallsPhoneContext);
}

declare global {
  interface Window {
    __PHONE_CONFIG__: PhoneConfig;
    __MARBLE_FALLS_PHONE_CONFIG__: PhoneConfig;
  }
}
