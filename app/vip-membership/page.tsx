/**
 * VIP Membership Page
 * 
 * Information and signup for VIP plumbing membership program
 */

import type { Metadata } from 'next';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import VIPMembershipClient from './VIPMembershipClient';

export const metadata: Metadata = {
  title: 'VIP Membership Program | Economy Plumbing Services',
  description: 'Join our VIP membership program for priority service, discounts, and exclusive benefits. Annual plumbing maintenance included.',
  openGraph: {
    title: 'VIP Membership Program',
    description: 'Priority service, discounts, and exclusive benefits for our VIP members',
  },
};

export default async function VIPMembershipPage({ searchParams }: {
  searchParams: Promise<{[key: string]: string | string[] | undefined}>
}) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig } = await getPhoneNumbers(urlParams);
  return <VIPMembershipClient phoneConfig={phoneConfig} />;
}
