import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

interface KingslandServiceAreaPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-kingsland', {
    title: 'Professional Plumber in Kingsland, TX | Economy Plumbing',
    description: 'Trusted plumbing services in Kingsland, TX. Water heater repair, drain cleaning, leak detection, commercial plumbing. Licensed plumbers. Call (830) 460-3565.',
    ogType: 'website',
    canonical: 'https://www.plumbersthatcare.com/service-areas/kingsland',
  });
}

export default async function KingslandServiceArea({ searchParams }: KingslandServiceAreaPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/service-areas/kingsland';
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Kingsland", url: canonical }
  ]);
  
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
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
        city="Kingsland"
        state="TX"
        slug="kingsland"
        metaDescription="Trusted plumbing services in Kingsland, TX. Water heater repair, drain cleaning, leak detection, commercial plumbing. Licensed plumbers. Call (830) 460-3565."
        canonical={canonical}
        area="marble-falls"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/plumber_working_on_p_780517d7.webp"
        heroSubtitle="Kingsland plumbing services with a focus on quality and customer satisfaction. Water heaters, leaks, drains, and more."
        cityHighlight="Your trusted plumber in Kingsland and the Highland Lakes region. Fast service, competitive pricing, and guaranteed satisfaction."
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
