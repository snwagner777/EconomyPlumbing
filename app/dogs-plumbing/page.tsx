/**
 * Dogs Doing Plumbing - Fun Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import DogsPlumbingClient from './DogsPlumbingClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/dogs-plumbing', {
    title: 'Dogs Doing Plumbing | Economy Plumbing Services',
    description: 'Meet our talented canine plumbers! Just for fun - see adorable dogs showing off their plumbing skills. For real plumbing needs, contact our expert human team.',
  });
}

export default async function DogsPlumbingPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <DogsPlumbingClient phoneConfig={phoneNumbers.austin} />;
}
