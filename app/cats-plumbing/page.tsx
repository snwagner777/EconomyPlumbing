/**
 * Cats Doing Plumbing - Fun Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import CatsPlumbingClient from './CatsPlumbingClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/cats-plumbing', {
    title: 'Cats Doing Plumbing | Economy Plumbing Services',
    description: 'Meet our talented feline plumbers! Just for fun - see adorable cats showing off their plumbing expertise. For real plumbing needs, contact our expert human team.',
  });
}

export default async function CatsPlumbingPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  return <CatsPlumbingClient phoneConfig={phoneNumbers.austin} />;
}
