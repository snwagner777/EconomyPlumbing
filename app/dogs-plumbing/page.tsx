/**
 * Dogs Doing Plumbing - Fun Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import DogsPlumbingClient from './DogsPlumbingClient';
import Script from 'next/script';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/dogs-plumbing', {
    title: 'Dogs Doing Plumbing - AI Generated Dog Plumber Images | Economy Plumbing Services',
    description: 'Enjoy our collection of AI-generated images featuring adorable dogs as plumbers! A fun, lighthearted gallery from Economy Plumbing Services. For real plumbing help, call our expert team in Austin, TX.',
  });
}

export default async function DogsPlumbingPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const phoneNumbers = await getPhoneNumbers(urlParams);
  
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Dogs Doing Plumbing - AI Generated Images",
    "description": "Collection of AI-generated images featuring dogs as plumbers. A fun marketing initiative from Economy Plumbing Services.",
    "url": "https://www.plumbersthatcare.com/dogs-plumbing",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Economy Plumbing Services",
      "url": "https://www.plumbersthatcare.com"
    },
    "mainEntity": {
      "@type": "ImageGallery",
      "name": "AI Generated Dog Plumbers Gallery",
      "description": "Adorable AI-generated images of dogs working as professional plumbers"
    },
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.plumbersthatcare.com/#business",
      "name": "Economy Plumbing Services",
      "telephone": phoneNumbers.austin.display,
      "url": "https://www.plumbersthatcare.com"
    }
  };
  
  return (
    <>
      <Script
        id="dogs-plumbing-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DogsPlumbingClient phoneConfig={phoneNumbers.austin} />
    </>
  );
}
