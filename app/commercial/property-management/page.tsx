/**
 * Property Management Plumbing Services Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import PropertyManagementClient from './PropertyManagementClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/commercial/property-management', {
    title: 'Property Management Plumbing Services | Economy Plumbing',
    description: 'Comprehensive plumbing solutions for property managers and multi-unit buildings. 24/7 tenant emergency response and preventive maintenance programs.',
  });
}

export default async function PropertyManagementPlumbingPage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <PropertyManagementClient phoneConfig={phoneNumbers.austin} />;
}
