/**
 * Airbnb & Short-Term Rental Plumbing Services
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import AirbnbServicesClient from './AirbnbServicesClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/services/airbnb', {
    title: 'Airbnb & Rental Property Plumbing Services | Economy Plumbing',
    description: 'Professional plumbing services for Airbnb hosts and rental property owners. Priority emergency service, preventive maintenance, and VIP membership plans to protect your investment.',
  });
}

export default async function AirbnbServicesPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <AirbnbServicesClient phoneConfig={phoneNumbers.austin} />;
}
