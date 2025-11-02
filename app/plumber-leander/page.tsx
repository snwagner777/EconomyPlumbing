import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createLocalBusinessSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-leander', {
    title: 'Plumber in Leander TX | Expert Plumbing Services',
    description: 'Leander plumber serving Crystal Falls, Travisso, Mason Hills. Expert water heater repair, drain cleaning, leak detection. Same-day service.',
    ogType: 'website',
  });
}

export default async function LeanderServiceArea() {
  const phoneNumbers = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Austin", path: "/plumber-austin" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Leander, TX", url: "https://www.plumbersthatcare.com/plumber-leander" }
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
        city="Leander"
        state="TX"
        slug="leander"
        metaDescription="Leander plumber serving Crystal Falls, Travisso, Mason Hills. Expert water heater repair, drain cleaning, leak detection. Same-day service."
        canonical="https://www.plumbersthatcare.com/plumber-leander"
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/professional_plumber_f5e4b5a9.webp"
        heroSubtitle="Expert plumbing services for Leander residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
        cityHighlight="Serving Leander and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={phoneNumbers.austin}
        marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
      />
    </>
  );
}
