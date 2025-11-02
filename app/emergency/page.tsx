/**
 * Emergency Plumbing Services Page
 */

import type { Metadata } from 'next';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import EmergencyClient from './EmergencyClient';

export const metadata: Metadata = {
  title: '24/7 Emergency Plumber Austin TX | Fast Response | Economy Plumbing',
  description: 'Emergency plumbing service available 24/7 in Austin. Fast response for burst pipes, sewer backups & major leaks. Nights/weekends/holidays. Call (512) 368-9159.',
  openGraph: {
    title: '24/7 Emergency Plumber Austin TX',
    description: 'Emergency plumbing service available 24/7. Fast response for plumbing emergencies.',
  },
};

export default async function EmergencyPlumbingPage({ searchParams }: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig } = await getPhoneNumbers(urlParams);
  
  return <EmergencyClient phoneConfig={phoneConfig} />;
}
