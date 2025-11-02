import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createLocalBusinessSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-liberty-hill', {
    title: 'Plumber in Liberty Hill TX | Expert Plumbing Services',
    description: 'Quality plumbing services in Liberty Hill, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 368-9159 for service.',
    ogType: 'website',
  });
}

export default async function LibertyHillServiceArea() {
  const phoneNumbers = await getPhoneNumbers();
  
  const nearbyCities = [
    { name: "Leander", path: "/plumber-leander" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
  ];

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Service Areas", url: "https://www.plumbersthatcare.com/service-areas" },
    { name: "Liberty Hill, TX", url: "https://www.plumbersthatcare.com/plumber-liberty-hill" }
  ]);

  const localBusiness = createLocalBusinessSchema();

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
        city="Liberty Hill"
        state="TX"
        slug="liberty-hill"
        metaDescription="Quality plumbing services in Liberty Hill, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 368-9159 for service."
        canonical="https://www.plumbersthatcare.com/plumber-liberty-hill"
        area="austin"
        nearbyCities={nearbyCities}
        heroImage="/attached_assets/optimized/professional_plumber_07b42e36.webp"
        heroSubtitle="Professional plumbing services for Liberty Hill's growing community. Same-day service, expert technicians, and upfront pricing."
        cityHighlight="As Liberty Hill continues to grow, we're here to serve both established neighborhoods and new developments with top-quality plumbing services."
        phoneConfig={phoneNumbers.austin}
        marbleFallsPhoneConfig={phoneNumbers.marbleFalls}
      />
    </>
  );
}
