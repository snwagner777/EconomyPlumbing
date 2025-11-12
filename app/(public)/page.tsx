import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import HomeClient from './HomeClient';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('/', {
    title: 'Economy Plumbing Services | Professional Plumbers in Austin & Marble Falls',
    description: 'Professional plumbing services in Austin, Cedar Park, Marble Falls and Central Texas. Licensed plumbers, upfront pricing, 24/7 emergency service. Call today!',
  });
}

export default async function Home({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers(urlParams);

  return (
    <HomeClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
