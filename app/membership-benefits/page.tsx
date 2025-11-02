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

export default async function MembershipBenefitsPage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <MembershipBenefitsClient phoneConfig={phoneNumbers.austin} />;
}
