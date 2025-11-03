import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createLocalBusinessSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-kyle', {
    title: 'Plumber in Kyle TX | Expert Plumbing Services',
    description: 'Reliable plumbing services in Kyle, TX. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 368-9159.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/kyle',
  });
}

export default async function KyleServiceArea() {
  const phoneNumbers = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Buda", path: "/plumber-buda" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Round Rock", path: "/round-rock-plumber" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Kyle, TX", url: "https://www.plumbersthatcare.com/plumber-kyle" }
  ]);

  const localBusiness = createLocalBusinessSchema();

  return (
    <>
      <script

        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script

        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <ServiceAreaPage
        city="Kyle"
        state="TX"
        slug="kyle"
        metaDescription="Reliable plumbing services in Kyle, TX. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 368-9159."
        canonical="https://www.plumbersthatcare.com/plumber-kyle"
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_fixing_sink__ddae57ac.webp"
        heroSubtitle="Expert plumbing services for Kyle residents. Quick response, quality repairs, and exceptional customer service every time."
        cityHighlight="Serving Kyle's rapidly expanding community with reliable plumbing services. We're equipped to handle both residential and commercial projects."
        phoneConfig={phoneNumbers.austin}
        marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
      />
    </>
  );
}
