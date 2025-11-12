/**
 * PhoneNumberProvider - Client Context for Phone Numbers
 * 
 * Provides company phone numbers to client components without prop drilling.
 * Phone numbers are fetched server-side and passed down via this context.
 * 
 * Usage:
 * ```tsx
 * // In a client component
 * import { usePhoneNumbers } from '@/components/PhoneNumberProvider';
 * 
 * function MyComponent() {
 *   const { austin, marbleFalls } = usePhoneNumbers();
 *   return <a href={austin.tel}>{austin.display}</a>;
 * }
 * ```
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface PhoneNumberContextValue {
  austin: PhoneConfig;
  marbleFalls: PhoneConfig;
}

const PhoneNumberContext = createContext<PhoneNumberContextValue | undefined>(undefined);

interface PhoneNumberProviderProps {
  children: ReactNode;
  austin: PhoneConfig;
  marbleFalls: PhoneConfig;
}

export function PhoneNumberProvider({ children, austin, marbleFalls }: PhoneNumberProviderProps) {
  return (
    <PhoneNumberContext.Provider value={{ austin, marbleFalls }}>
      {children}
    </PhoneNumberContext.Provider>
  );
}

export function usePhoneNumbers(): PhoneNumberContextValue {
  const context = useContext(PhoneNumberContext);
  if (context === undefined) {
    throw new Error('usePhoneNumbers must be used within a PhoneNumberProvider');
  }
  return context;
}
