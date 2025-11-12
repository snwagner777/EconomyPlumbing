/**
 * MarketingPageShell - Server Component
 * 
 * Provides consistent layout for all marketing pages with server-fetched phone numbers.
 * Fetches company phone numbers via getPhoneNumbers() and passes to Header/Footer.
 * Wraps children in PhoneNumberProvider for client components to access phone data.
 * 
 * Usage:
 * ```tsx
 * // In your page.tsx (server component)
 * export default async function MyPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
 *   const params = await searchParams;
 *   return (
 *     <MarketingPageShell searchParams={params}>
 *       <MyPageClient />
 *     </MarketingPageShell>
 *   );
 * }
 * ```
 */

import { ReactNode } from 'react';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PhoneNumberProvider } from '@/components/PhoneNumberProvider';

interface MarketingPageShellProps {
  children: ReactNode;
  searchParams?: {[key: string]: string | string[] | undefined};
  isPortalAuthenticated?: boolean;
  onPortalLogout?: () => void;
}

export async function MarketingPageShell({ 
  children, 
  searchParams = {},
  isPortalAuthenticated,
  onPortalLogout
}: MarketingPageShellProps) {
  // Convert searchParams to URLSearchParams for getPhoneNumbers()
  const urlParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      urlParams.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  // Fetch phone numbers server-side with UTM tracking
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers(urlParams);

  return (
    <PhoneNumberProvider austin={phoneConfig} marbleFalls={marbleFallsPhoneConfig}>
      <Header 
        austinPhone={phoneConfig}
        marbleFallsPhone={marbleFallsPhoneConfig}
        isPortalAuthenticated={isPortalAuthenticated}
        onPortalLogout={onPortalLogout}
      />
      {children}
      <Footer 
        austinPhone={phoneConfig}
        marbleFallsPhone={marbleFallsPhoneConfig}
      />
    </PhoneNumberProvider>
  );
}
