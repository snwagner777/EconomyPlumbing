import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { storage } from '@/server/storage';
import ServiceAreaClient from './ServiceAreaClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const serviceArea = await storage.getServiceAreaBySlug(slug);
  
  const cityName = serviceArea?.cityName || 'Central Texas';
  
  return await getPageMetadata(`/service-area/${slug}`, {
    title: `Expert Plumbing Services in ${cityName}, TX | Economy Plumbing`,
    description: serviceArea?.introContent || `Professional plumbing services in ${cityName}, Texas. Same-day service, upfront pricing, 100% satisfaction guaranteed.`,
  });
}

export default async function ServiceAreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const urlParams = new URLSearchParams();
  
  // Fetch data server-side
  const [phoneNumbers, serviceArea] = await Promise.all([
    getPhoneNumbers(urlParams),
    storage.getServiceAreaBySlug(slug)
  ]);

  // Pass all data to Client component
  return (
    <ServiceAreaClient 
      slug={slug}
      serviceArea={serviceArea}
      phoneConfig={phoneNumbers.austin}
      marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
    />
  );
}
