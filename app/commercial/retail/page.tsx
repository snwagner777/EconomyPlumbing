/**
 * Retail Store Plumbing Services Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import RetailClient from './RetailClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/commercial/retail', {
    title: 'Retail Store Plumbing Services | Economy Plumbing',
    description: 'Keep your store running smoothly with professional retail plumbing services. Customer restroom maintenance, emergency repairs, and preventive plans.',
  });
}

export default async function RetailPlumbingPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <RetailClient phoneConfig={phoneNumbers.austin} />;
}
