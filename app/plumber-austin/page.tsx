import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface AustinServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-austin', {
    title: 'Professional Plumber in Austin, TX | Economy Plumbing',
    description: 'Austin plumber serving Downtown, South Congress, East Austin. Expert water heater repair, drain cleaning, leak detection. Same-day service.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/austin',
  });
}

export default async function AustinServiceArea({ searchParams }: AustinServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/plumber-austin';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Austin", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Buda", path: "/plumber-buda" },
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
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
        city="Austin"
        state="TX"
        slug="austin"
        metaDescription="Austin plumber serving Downtown, South Congress, East Austin. Expert water heater repair, drain cleaning, leak detection. Same-day service."
        canonical={canonical}
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/professional_plumber_49e7ef9b.webp"
        heroSubtitle="Expert plumbing services for Austin residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
        cityHighlight="Serving Austin Metro and surrounding areas with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
