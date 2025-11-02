/**
 * Fixture Installation Page
 */

import type { Metadata } from 'next';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import FixtureInstallationClient from './FixtureInstallationClient';

interface FixtureInstallationPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Plumbing Fixture Installation Austin TX | Faucets, Toilets & More',
  description: 'Expert plumbing fixture installation in Austin. Faucets, toilets, sinks, showers, bathtubs. Professional installation guaranteed. Call (512) 368-9159.',
  openGraph: {
    title: 'Plumbing Fixture Installation Austin TX',
    description: 'Expert installation of faucets, toilets, sinks, showers and more',
  },
};

export default async function FixtureInstallationPage({ searchParams }: FixtureInstallationPageProps) {
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

  return <FixtureInstallationClient phoneConfig={phoneConfig} />;
}
