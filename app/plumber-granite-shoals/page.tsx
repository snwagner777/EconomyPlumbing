import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface GraniteShoalsServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-granite-shoals', {
    title: 'Professional Plumber in Granite Shoals, TX | Economy Plumbing',
    description: 'Reliable plumbing services in Granite Shoals, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service. Call (830) 460-3565.',
    ogType: 'website',
  });
}

export default async function GraniteShoalsServiceArea({ searchParams }: GraniteShoalsServiceAreaPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Convert to URLSearchParams for phone number resolution
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      const stringValue = Array.isArray(value) ? value[0] : value;
      if (stringValue) urlParams.set(key, stringValue);
    }
  });
  
  // Fetch phone numbers server-side for SEO
  const { austin, marbleFalls } = await getPhoneNumbers(urlParams);
  
  // Generate JSON-LD schemas for SEO
  const canonical = 'https://www.plumbersthatcare.com/plumber-granite-shoals';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Granite Shoals", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script

        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Client component with interactive features */}
      <ServiceAreaPage
        city="Granite Shoals"
        state="TX"
        slug="granite-shoals"
        metaDescription="Reliable plumbing services in Granite Shoals, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service. Call (830) 460-3565."
        canonical={canonical}
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_water_heater_89ac0930.webp"
        heroSubtitle="Granite Shoals plumbing specialists providing water heater services, leak repairs, and drain cleaning. Your local plumbing experts."
        cityHighlight="Located in the heart of the Highland Lakes, we provide specialized plumbing services for Granite Shoals homes and businesses."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
