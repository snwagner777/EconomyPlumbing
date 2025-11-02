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

export default async function SummerPlumbingPrepPage() {
  const phoneNumbers = await getPhoneNumbers();
  
  return <SummerPrepClient phoneConfig={phoneNumbers.austin} />;
}
