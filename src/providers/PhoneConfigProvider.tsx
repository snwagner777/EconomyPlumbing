import { headers } from 'next/headers';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { PhoneConfigContext } from '@/providers/PhoneConfigContext';

/**
 * Server Component Provider for Phone Configuration
 * 
 * This provider:
 * 1. Runs on the server during SSR
 * 2. Reads URL search params from middleware-injected header
 * 3. Calls getPhoneNumbers() with UTM tracking
 * 4. Provides phone configs to all client components via context
 * 
 * Architecture Benefits:
 * - One centralized phone number resolution
 * - Automatic UTM tracking across all pages
 * - No per-page prop plumbing required
 * - Header component automatically gets correct phone numbers
 * - Still supports prop overrides for special cases
 */
export async function PhoneConfigProvider({ children }: { children: React.ReactNode }) {
  // Get search params from middleware-injected header
  const headersList = await headers();
  const searchParamsJson = headersList.get('x-search-params');
  
  // Parse search params if available
  let searchParams: URLSearchParams | undefined;
  if (searchParamsJson) {
    try {
      const paramsObject = JSON.parse(searchParamsJson);
      searchParams = new URLSearchParams(paramsObject);
    } catch (error) {
      console.error('[PhoneConfigProvider] Error parsing search params:', error);
    }
  }
  
  // Fetch phone numbers with UTM tracking
  const phoneConfig = await getPhoneNumbers(searchParams);
  
  return (
    <PhoneConfigContext.Provider value={phoneConfig}>
      {children}
    </PhoneConfigContext.Provider>
  );
}
