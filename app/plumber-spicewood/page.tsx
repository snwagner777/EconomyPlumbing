import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createMarbleFallsLocationSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-spicewood', {
    title: 'Plumber in Spicewood TX | Expert Plumbing Services',
    description: 'Expert plumbing services in Spicewood, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Same-day service. Call (830) 460-3565.',
    ogType: 'website',
  });
}

export default async function SpicewoodServiceArea() {
  const phoneConfig = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Spicewood, TX", url: "https://www.plumbersthatcare.com/plumber-spicewood" }
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
        city="Spicewood"
        state="TX"
        slug="spicewood"
        metaDescription="Expert plumbing services in Spicewood, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Same-day service. Call (830) 460-3565."
        canonical="https://www.plumbersthatcare.com/plumber-spicewood"
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_water_heater_57dd8e1a.webp"
        heroSubtitle="Quality plumbing services for Spicewood homes and lake properties. Specialized in water heater installations and emergency repairs."
        cityHighlight="Proudly serving Spicewood and the surrounding Hill Country area. We understand the unique plumbing needs of lakefront properties and rural homes."
        phoneConfig={phoneConfig}
      />
    </>
  );
}
