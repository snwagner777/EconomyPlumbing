/**
 * Cats Doing Plumbing - Fun Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import CatsPlumbingClient from './CatsPlumbingClient';
import Script from 'next/script';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/cats-plumbing', {
    title: 'Cats Doing Plumbing - AI Generated Cat Plumber Images | Economy Plumbing Services',
    description: 'Explore our delightful collection of AI-generated images featuring cats as plumbers! A fun, creative gallery from Economy Plumbing Services. For real plumbing services, call our Austin, TX experts.',
  });
}

export default async function CatsPlumbingPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
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
    "name": "Cats Doing Plumbing - AI Generated Images",
    "description": "Collection of AI-generated images featuring cats as plumbers. A creative marketing initiative from Economy Plumbing Services.",
    "url": "https://www.plumbersthatcare.com/cats-plumbing",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Economy Plumbing Services",
      "url": "https://www.plumbersthatcare.com"
    },
    "mainEntity": {
      "@type": "ImageGallery",
      "name": "AI Generated Cat Plumbers Gallery",
      "description": "Charming AI-generated images of cats working as professional plumbers"
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
        id="cats-plumbing-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CatsPlumbingClient phoneConfig={phoneNumbers.austin} />
    </>
  );
}
