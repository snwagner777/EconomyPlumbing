/**
 * Membership Benefits Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import MembershipBenefitsClient from './MembershipBenefitsClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/membership-benefits', {
    title: 'VIP Membership Benefits | Economy Plumbing Services',
    description: 'Join our VIP membership program for priority scheduling, discounted rates, annual maintenance, and 24/7 VIP support. Protect your home or business and save money.',
  });
}

export default async function MembershipBenefitsPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <MembershipBenefitsClient phoneConfig={phoneNumbers.austin} />;
}
