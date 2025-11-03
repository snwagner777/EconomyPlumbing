import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createMarbleFallsLocationSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-marble-falls', {
    title: 'Plumber in Marble Falls TX | Expert Plumbing Services',
    description: 'Expert plumbing services in Marble Falls, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Licensed plumbers. Call (830) 460-3565.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/marble-falls',
  });
}

export default async function MarbleFallsServiceArea() {
  const phoneNumbers = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Spicewood", path: "/plumber-spicewood" },
    { name: "Bertram", path: "/plumber-bertram" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Marble Falls, TX", url: "https://www.plumbersthatcare.com/plumber-marble-falls" }
  ]);

  const localBusiness = createMarbleFallsLocationSchema();

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
        city="Marble Falls"
        state="TX"
        slug="marble-falls"
        metaDescription="Expert plumbing services in Marble Falls, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Licensed plumbers. Call (830) 460-3565."
        canonical="https://www.plumbersthatcare.com/plumber-marble-falls"
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_fixing_sink__a8fb92e9.webp"
        heroSubtitle="Marble Falls' trusted plumbing experts since 2012. Specializing in water heaters, drain cleaning, and emergency plumbing services."
        cityHighlight="Serving Marble Falls and the Highland Lakes area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={phoneNumbers.austin}
        marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
      />
    </>
  );
}
