'use client';

import { createContext, useContext } from 'react';

/**
 * Phone configuration type from server/lib/phoneNumbers.ts
 */
export interface PhoneConfig {
  display: string;
  tel: string;
}

/**
 * Phone configuration for both service areas
 */
export interface PhoneConfigContextValue {
  austin: PhoneConfig;
  marbleFalls: PhoneConfig;
}

/**
 * Default fallback phone numbers
 * These are used only if context is somehow not available
 */
const DEFAULT_AUSTIN_PHONE: PhoneConfig = {
  display: '(512) 368-9159',
  tel: 'tel:+15123689159',
};

const DEFAULT_MARBLE_FALLS_PHONE: PhoneConfig = {
  display: '(830) 201-3129',
  tel: 'tel:+18302013129',
};

/**
 * React Context for Phone Configuration
 * 
 * This context is populated by PhoneConfigProvider (server component)
 * and consumed by client components like Header
 */
export const PhoneConfigContext = createContext<PhoneConfigContextValue>({
  austin: DEFAULT_AUSTIN_PHONE,
  marbleFalls: DEFAULT_MARBLE_FALLS_PHONE,
});

/**
 * Hook to access phone configuration in client components
 * 
 * Usage:
 * ```tsx
 * const { austin, marbleFalls } = usePhoneConfig();
 * <a href={austin.tel}>{austin.display}</a>
 * ```
 */
export function usePhoneConfig(): PhoneConfigContextValue {
  const context = useContext(PhoneConfigContext);
  
  if (!context) {
    console.warn('[usePhoneConfig] Context not available, using defaults');
    return {
      austin: DEFAULT_AUSTIN_PHONE,
      marbleFalls: DEFAULT_MARBLE_FALLS_PHONE,
    };
  }
  
  return context;
}
