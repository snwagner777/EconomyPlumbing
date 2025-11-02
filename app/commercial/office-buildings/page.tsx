/**
 * Office Building Plumbing Services Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import OfficeBuildingsClient from './OfficeBuildingsClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/commercial/office-buildings', {
    title: 'Office Building Plumbing Services | Economy Plumbing',
    description: 'Professional plumbing solutions for office buildings and commercial spaces. Multi-floor systems, restroom management, and preventive maintenance.',
  });
}

export default async function OfficeBuildingPlumbingPage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <OfficeBuildingsClient phoneConfig={phoneNumbers.austin} />;
}
