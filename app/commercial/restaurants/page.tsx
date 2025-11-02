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

export default async function RestaurantPlumbingPage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <RestaurantsClient phoneConfig={phoneNumbers.austin} />;
}
