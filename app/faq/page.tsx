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
    description: 'Answers to common plumbing questions about water heaters, drains, leaks, gas services, and pricing. Expert advice for Austin and Central Texas.',
  });
}

export default async function FAQPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <FAQClient phoneConfig={phoneNumbers.austin} />;
}
