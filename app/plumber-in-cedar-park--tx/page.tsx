import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface CedarParkServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-in-cedar-park--tx', {
    title: 'Professional Plumber in Cedar Park, TX | Economy Plumbing',
    description: 'Cedar Park plumber for Lakeline, Buttercup Creek, Whitestone. Expert water heater installation, drain cleaning, gas lines. Same-day service.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/cedar-park',
  });
}

export default async function CedarParkServiceArea({ searchParams }: CedarParkServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/plumber-in-cedar-park--tx';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Cedar Park", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Austin", path: "/plumber-austin" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Georgetown", path: "/plumber-georgetown" },
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
        city="Cedar Park"
        state="TX"
        slug="cedar-park"
        metaDescription="Cedar Park plumber for Lakeline, Buttercup Creek, Whitestone. Expert water heater installation, drain cleaning, gas lines. Same-day service."
        canonical={canonical}
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/professional_plumber_d3924ca6.webp"
        heroSubtitle="Expert plumbing services for Cedar Park residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
        cityHighlight="Serving Cedar Park and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
