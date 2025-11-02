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

export default async function RetailPlumbingPage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <RetailClient phoneConfig={phoneNumbers.austin} />;
}
