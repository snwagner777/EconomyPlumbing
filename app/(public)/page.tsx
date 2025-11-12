import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { MarketingPageShell } from '@/components/MarketingPageShell';
import HomeClient from './HomeClient';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('/', {
    title: 'Economy Plumbing Services | Professional Plumbers in Austin & Marble Falls',
    description: 'Professional plumbing services in Austin, Cedar Park, Marble Falls and Central Texas. Licensed plumbers, upfront pricing, 24/7 emergency service. Call today!',
  });
}

export default async function Home({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  
  return (
    <MarketingPageShell searchParams={search}>
      <HomeClient />
    </MarketingPageShell>
  );
}
