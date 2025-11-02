/**
 * Whole Home Repiping Page
 */

import type { Metadata } from 'next';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import RepipingClient from './RepipingClient';

interface RepipingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Whole Home Repiping Austin TX | Copper & PEX Installation',
  description: 'Complete home repiping services in Austin. Replace old galvanized or polybutylene pipes with copper or PEX. Financing available. Call (512) 368-9159.',
  openGraph: {
    title: 'Whole Home Repiping Austin TX',
    description: 'Complete home repiping services. Replace old pipes with modern materials.',
  },
};

export default async function RepipingPage({ searchParams }: RepipingPageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = Array.isArray(value) ? value[0] : value;
      }
      return acc;
    }, {} as Record<string, string>)
  );
  
  const { austin: phoneConfig } = await getPhoneNumbers(urlParams);

  return <RepipingClient phoneConfig={phoneConfig} />;
}
