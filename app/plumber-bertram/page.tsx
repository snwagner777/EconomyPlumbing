import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface BertramServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-bertram', {
    title: 'Professional Plumber in Bertram, TX | Economy Plumbing',
    description: 'Professional plumbing services in Bertram, TX. Water heater install, drain cleaning, leak repair, gas services. Licensed & insured. Call (830) 460-3565.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/bertram',
  });
}

export default async function BertramServiceArea({ searchParams }: BertramServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/service-areas/bertram';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Bertram", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Marble Falls", path: "/plumber-marble-falls" },
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
        city="Bertram"
        state="TX"
        slug="bertram"
        metaDescription="Professional plumbing services in Bertram, TX. Water heater install, drain cleaning, leak repair, gas services. Licensed & insured. Call (830) 460-3565."
        canonical={canonical}
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_water_heater_1d323d32.webp"
        heroSubtitle="Bertram's trusted local plumber for water heater services, drain cleaning, and emergency repairs. Honest pricing, quality work."
        cityHighlight="Proudly serving Bertram and the surrounding Burnet County area with professional plumbing services tailored to your community's needs."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
