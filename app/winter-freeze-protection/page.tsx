/**
 * Winter Freeze Protection Page - Server Component
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import WinterFreezeClient from './WinterFreezeClient';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('/winter-freeze-protection', {
    title: 'Winter Freeze Protection | Prevent Frozen Pipes Austin TX',
    description: 'Protect your Austin home from frozen pipes. Free winter plumbing checklist, freeze prevention tips, and emergency service. Call (512) 368-9159.',
    ogType: 'website',
  });
}

export default async function WinterFreezeProtectionPage() {
  const phoneNumbers = await getPhoneNumbers();
  
  return <WinterFreezeClient phoneConfig={phoneNumbers.austin} />;
}
