import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface HorseshoeBayServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-horseshoe-bay', {
    title: 'Professional Plumber in Horseshoe Bay, TX | Economy Plumbing',
    description: 'Quality plumbing services in Horseshoe Bay, TX. Water heater services, drain cleaning, leak repair, and emergency plumbing. Call (830) 460-3565 for service.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/horseshoe-bay',
  });
}

export default async function HorseshoeBayServiceArea({ searchParams }: HorseshoeBayServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/service-areas/horseshoe-bay';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Horseshoe Bay", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Spicewood", path: "/plumber-spicewood" },
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
        city="Horseshoe Bay"
        state="TX"
        slug="horseshoe-bay"
        metaDescription="Quality plumbing services in Horseshoe Bay, TX. Water heater services, drain cleaning, leak repair, and emergency plumbing. Call (830) 460-3565 for service."
        canonical={canonical}
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_working_bath_98208ff5.webp"
        heroSubtitle="Horseshoe Bay's plumbing experts. Specialized service for lakefront properties, residential homes, and vacation rentals."
        cityHighlight="Serving Horseshoe Bay's unique plumbing needs. We understand lakefront properties and provide specialized solutions for this waterfront community."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
