import { headers } from 'next/headers';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { PhoneConfigClientProvider } from '@/providers/PhoneConfigContext';

/**
 * Server Component Provider for Phone Configuration
 * 
 * This provider:
 * 1. Runs on the server during SSR
 * 2. Reads URL search params from proxy-injected header
 * 3. Calls getPhoneNumbers() with UTM tracking
 * 4. Passes phone configs to client provider component
 * 5. Client provider shares data via React context
 * 
 * Architecture Benefits:
 * - One centralized phone number resolution
 * - Automatic UTM tracking across all pages
 * - No per-page prop plumbing required
 * - Header component automatically gets correct phone numbers
 * - Still supports prop overrides for special cases
 */
export async function PhoneConfigProvider({ children }: { children: React.ReactNode }) {
  // Get search params from proxy-injected header
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
  
  // Fetch phone numbers with UTM tracking (server-side)
  const phoneConfig = await getPhoneNumbers(searchParams);
  
  // Pass data to client provider component
  return (
    <PhoneConfigClientProvider value={phoneConfig}>
      {children}
    </PhoneConfigClientProvider>
  );
}
