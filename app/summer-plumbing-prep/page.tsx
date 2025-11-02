/**
 * Summer Plumbing Prep Page - Server Component
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import SummerPrepClient from './SummerPrepClient';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('/summer-plumbing-prep', {
    title: 'Summer Plumbing Prep Checklist | Economy Plumbing Services Austin',
    description: 'Prepare your plumbing for summer in Austin. AC drain lines, sprinklers, water heaters. Get your free summer plumbing checklist!',
    ogType: 'website',
  });
}

export default async function SummerPlumbingPrepPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <SummerPrepClient phoneConfig={phoneNumbers.austin} />;
}
