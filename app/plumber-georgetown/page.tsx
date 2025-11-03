import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface GeorgetownServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-georgetown', {
    title: 'Professional Plumber in Georgetown, TX | Economy Plumbing',
    description: 'Georgetown plumber for Sun City, Wolf Ranch, Berry Creek. Expert water heater repair, drain cleaning, emergency plumbing. Licensed plumbers.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/georgetown',
  });
}

export default async function GeorgetownServiceArea({ searchParams }: GeorgetownServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/service-areas/georgetown';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Georgetown", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
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
        city="Georgetown"
        state="TX"
        slug="georgetown"
        metaDescription="Georgetown plumber for Sun City, Wolf Ranch, Berry Creek. Expert water heater repair, drain cleaning, emergency plumbing. Licensed plumbers."
        canonical={canonical}
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumbing_maintenance_91eba3a0.webp"
        heroSubtitle="Expert plumbing services for Georgetown residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
        cityHighlight="Serving Georgetown and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
