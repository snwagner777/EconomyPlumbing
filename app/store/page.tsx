/**
 * Store Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import StoreClient from './StoreClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/store', {
    title: 'Plumbing Products & Supplies | Economy Plumbing Services',
    description: 'Shop quality plumbing products and supplies. Professional-grade materials delivered to your door in Austin and Marble Falls areas. Expert installation support available.',
  });
}

export default async function StorePage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <StoreClient phoneConfig={phoneNumbers.austin} />;
}
