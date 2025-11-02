/**
 * FAQ Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import FAQClient from './FAQClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/faq', {
    title: 'Frequently Asked Questions | Economy Plumbing Services',
    description: 'Find answers to common plumbing questions about water heaters, drains, leaks, gas services, pricing, and more. Expert plumbing advice for Austin and Central Texas.',
  });
}

export default async function FAQPage() {
  const urlParams = new URLSearchParams();
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <FAQClient phoneConfig={phoneNumbers.austin} />;
}
