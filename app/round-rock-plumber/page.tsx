import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createLocalBusinessSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/round-rock-plumber', {
    title: 'Plumber in Round Rock TX | Expert Plumbing Services',
    description: 'Round Rock plumber for Teravista, Forest Creek, Walsh Ranch. Expert water heater repair, drain cleaning, leak detection. Emergency plumbing.',
    ogType: 'website',
  });
}

export default async function RoundRockServiceArea() {
  const phoneNumbers = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Leander", path: "/plumber-leander" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Round Rock, TX", url: "https://www.plumbersthatcare.com/round-rock-plumber" }
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
        city="Round Rock"
        state="TX"
        slug="round-rock"
        metaDescription="Round Rock plumber for Teravista, Forest Creek, Walsh Ranch. Expert water heater repair, drain cleaning, leak detection. Emergency plumbing."
        canonical="https://www.plumbersthatcare.com/round-rock-plumber"
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_working_on_p_6dc2075d.webp"
        heroSubtitle="Expert plumbing services for Round Rock residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
        cityHighlight="Serving Round Rock and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={phoneNumbers.austin}
        marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
      />
    </>
  );
}
