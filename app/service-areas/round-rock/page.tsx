/**
 * Round Rock Service Area Page
 */

import type { Metadata } from 'next';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import RoundRockClient from './RoundRockClient';

export const metadata: Metadata = {
  title: 'Round Rock Plumber | Economy Plumbing Services TX',
  description: 'Trusted plumber in Round Rock TX. Water heaters, drain cleaning, leak repair, emergency service 24/7. Licensed & insured. Call (512) 368-9159.',
  openGraph: {
    title: 'Round Rock Plumber - Economy Plumbing',
    description: 'Professional plumbing services for Round Rock, TX',
  },
};

export default async function RoundRockPage({ searchParams }: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig } = await getPhoneNumbers(urlParams);
  return <RoundRockClient phoneConfig={phoneConfig} />;
}
