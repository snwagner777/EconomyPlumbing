import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { getPhoneNumber } from '@/lib/dynamicPhoneNumbers';

interface PhoneConfig {
  display: string;
  tel: string;
}

declare global {
  interface Window {
    __PHONE_CONFIG__: PhoneConfig;
  }
}

const DEFAULT_PHONE: PhoneConfig = {
  display: '(512) 368-9159',
  tel: 'tel:+15123689159'
};

const PhoneConfigContext = createContext<PhoneConfig>(DEFAULT_PHONE);

export function PhoneConfigProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [phoneConfig, setPhoneConfig] = useState<PhoneConfig>(() => {
    // Initialize from window.__PHONE_CONFIG__ set by inline script in index.html
    if (window.__PHONE_CONFIG__) {
      return window.__PHONE_CONFIG__;
    }
    return DEFAULT_PHONE;
  });

  useEffect(() => {
    // Directly get the phone number based on current URL/cookies
    const newConfig = getPhoneNumber();
    
    // Update both the window global (for legacy code) and React state
    window.__PHONE_CONFIG__ = newConfig;
    setPhoneConfig(newConfig);
  }, [location]);

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
  return {
    display: '(830) 460-3565',
    tel: 'tel:+18304603565'
  };
}
