import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface BudaServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-buda', {
    title: 'Professional Plumber in Buda, TX | Economy Plumbing',
    description: 'Buda, TX plumber near Austin. Expert water heater repair, drain cleaning & emergency plumbing services. Same-day service available. Call (512) 368-9159 now.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/buda',
  });
}

export default async function BudaServiceArea({ searchParams }: BudaServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/plumber-buda';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Buda", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
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
        city="Buda"
        state="TX"
        slug="buda"
        metaDescription="Buda, TX plumber near Austin. Expert water heater repair, drain cleaning & emergency plumbing services. Same-day service available. Call (512) 368-9159 now."
        canonical={canonical}
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_fixing_sink__b2426749.webp"
        heroSubtitle="Trusted plumbing experts serving Buda families and businesses. Fast response times, quality workmanship, and competitive rates."
        cityHighlight="Serving Buda's growing community with reliable plumbing services. From new construction to emergency repairs, we're your local plumbing partner."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
