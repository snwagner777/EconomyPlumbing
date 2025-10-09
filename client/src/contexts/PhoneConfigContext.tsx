import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { updatePhoneConfig } from '@/lib/dynamicPhoneNumbers';

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
  const [phoneConfig, setPhoneConfig] = useState<PhoneConfig>(
    () => window.__PHONE_CONFIG__ || DEFAULT_PHONE
  );

  useEffect(() => {
    // Update phone config when route changes
    updatePhoneConfig();
    
    // Small delay to ensure window.__PHONE_CONFIG__ is updated
    const timer = setTimeout(() => {
      setPhoneConfig(window.__PHONE_CONFIG__ || DEFAULT_PHONE);
    }, 150);

    return () => clearTimeout(timer);
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
