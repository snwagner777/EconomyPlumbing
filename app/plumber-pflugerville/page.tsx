import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createLocalBusinessSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-pflugerville', {
    title: 'Plumber in Pflugerville TX | Expert Plumbing Services',
    description: 'Pflugerville plumber for Falcon Pointe, Blackhawk, Springbrook. Expert water heater repair, drain cleaning, gas lines. Licensed plumbers.',
    ogType: 'website',
  });
}

export default async function PflugervilleServiceArea() {
  const phoneNumbers = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Pflugerville, TX", url: "https://www.plumbersthatcare.com/plumber-pflugerville" }
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
        city="Pflugerville"
        state="TX"
        slug="pflugerville"
        metaDescription="Pflugerville plumber for Falcon Pointe, Blackhawk, Springbrook. Expert water heater repair, drain cleaning, gas lines. Licensed plumbers."
        canonical="https://www.plumbersthatcare.com/plumber-pflugerville"
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_working_on_p_e4a794f0.webp"
        heroSubtitle="Expert plumbing services for Pflugerville residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
        cityHighlight="Serving Pflugerville and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={phoneNumbers.austin}
        marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
      />
    </>
  );
}
