import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface BurnetServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-burnet', {
    title: 'Professional Plumber in Burnet, TX | Economy Plumbing',
    description: 'Professional plumbing services in Burnet, TX. Water heater installation, drain cleaning, leak repair, and more. Licensed & insured. Call (830) 460-3565.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/burnet',
  });
}

export default async function BurnetServiceArea({ searchParams }: BurnetServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/plumber-burnet';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Burnet", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Bertram", path: "/plumber-bertram" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
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
        city="Burnet"
        state="TX"
        slug="burnet"
        metaDescription="Professional plumbing services in Burnet, TX. Water heater installation, drain cleaning, leak repair, and more. Licensed & insured. Call (830) 460-3565."
        canonical={canonical}
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_working_bath_2fe77426.webp"
        heroSubtitle="Burnet's preferred plumbing service provider. Fast, reliable solutions for all your residential and commercial plumbing needs."
        cityHighlight="Serving Burnet County with pride. From routine maintenance to complex installations, we handle all your plumbing requirements."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
