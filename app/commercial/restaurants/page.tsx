/**
 * Restaurant Plumbing Services Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import RestaurantsClient from './RestaurantsClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/commercial/restaurants', {
    title: 'Restaurant Plumbing Services | Economy Plumbing',
    description: 'Keep your kitchen running with expert commercial plumbing for restaurants. Grease trap service, emergency drain clearing, and 24/7 support.',
  });
}

export default async function RestaurantPlumbingPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <RestaurantsClient phoneConfig={phoneNumbers.austin} />;
}
