import type { Metadata } from 'next';
import Script from 'next/script';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServicePage from "@/components/ServicePage";
import CommercialCustomersShowcase from "@/components/CommercialCustomersShowcase";

/**
 * Commercial Plumbing Services Page - Server Component with SEO
 * 
 * Metadata and JSON-LD rendered server-side for proper SEO
 * Phone numbers server-rendered for crawlers, upgraded client-side for tracking
 */

interface CommercialPlumbingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/commercial-plumbing', {
    title: 'Commercial Plumbing Austin TX | Business Solutions 24/7',
    description: 'Minimize downtime with 24/7 commercial plumbing in Austin. Preventive maintenance, emergency repairs and code compliance for businesses. Call (512) 368-9159.',
    ogImage: 'https://www.plumbersthatcare.com/attached_assets/optimized/Commercial_plumbing_services_bd7b6306.webp',
    ogType: 'website',
  });
}

const faqs = [
  {
    question: "What types of commercial properties do you service?",
    answer: "We service all types of commercial properties including restaurants, retail stores, office buildings, medical facilities, schools, hotels, apartment complexes, and industrial facilities. Our experience spans all commercial applications."
  },
  {
    question: "Do you offer after-hours service?",
    answer: "Yes, we provide 24/7 emergency service for commercial clients. We understand that plumbing emergencies don't follow business hours, and we're always available when you need us."
  },
  {
    question: "Can you work around our business hours?",
    answer: "Absolutely. We schedule non-emergency work to minimize disruption, including evenings, weekends, or during your slow periods. For occupied buildings, we work quietly and efficiently to not disturb tenants or customers."
  },
  {
    question: "Do you offer preventive maintenance contracts?",
    answer: "Yes, we offer customized preventive maintenance programs with scheduled inspections and service. Regular maintenance prevents emergencies, extends equipment life, and provides priority emergency service when needed."
  },
  {
    question: "Are you licensed for commercial plumbing work?",
    answer: "Yes, we hold all required licenses and insurance for commercial plumbing work in Texas. Our Master Plumber license (#M-41147) covers both residential and commercial applications."
  },
  {
    question: "How quickly can you respond to commercial emergencies?",
    answer: "We prioritize commercial emergencies and typically respond within 1-2 hours. For critical situations affecting business operations, we often arrive even faster. Our fully-stocked trucks allow us to complete most repairs immediately."
  }
];

export default async function CommercialPlumbing({ searchParams }: CommercialPlumbingPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/commercial-plumbing';
  const serviceSchema = createServiceSchema(
    'Commercial Plumbing Services',
    'Minimize downtime with 24/7 commercial plumbing in Austin. Preventive maintenance, emergency repairs and code compliance.',
    canonical
  );
  const faqSchema = createFAQSchema(faqs);
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Services", url: "https://www.plumbersthatcare.com/services" },
    { name: "Commercial Plumbing Services", url: canonical }
  ]);
  
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="commercial-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="commercial-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="commercial-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Client component with interactive features */}
      <ServicePage
        title="Commercial Plumbing Austin TX | Business Solutions 24/7"
        metaDescription="Minimize downtime with 24/7 commercial plumbing in Austin. Preventive maintenance, emergency repairs and code compliance for businesses. Call (512) 368-9159."
        canonical={canonical}
        heroImage="/attached_assets/optimized/Commercial_plumbing_services_bd7b6306.webp"
        heroImageAlt="Professional commercial plumbing services for businesses in Austin and Marble Falls TX"
        heroTitle="Commercial Plumbing Services"
        heroSubtitle="Professional Plumbing Solutions for Central Texas Businesses"
        overviewTitle="Comprehensive Commercial Plumbing"
        overviewDescription="Keep your business running smoothly with reliable commercial plumbing services. From routine maintenance to emergency repairs, we provide fast, professional service that minimizes downtime and keeps your operations flowing."
        customSection={<CommercialCustomersShowcase />}
        benefits={[
          "24/7 emergency service",
          "Scheduled maintenance plans",
          "Licensed & insured",
          "Code compliance expertise",
          "Minimal business disruption",
          "Preventive maintenance",
          "Multi-location service",
          "Detailed documentation"
        ]}
        featuresTitle="Our Commercial Plumbing Services"
        features={[
          {
            title: "Emergency Commercial Repairs",
            description: "24/7 emergency response for commercial plumbing failures. We understand downtime costs money, so we respond quickly to minimize disruption to your business operations."
          },
          {
            title: "Preventive Maintenance",
            description: "Scheduled maintenance programs designed to prevent costly breakdowns and extend equipment life. Regular inspections identify issues before they become emergencies."
          },
          {
            title: "Code Compliance",
            description: "Expert knowledge of commercial plumbing codes and regulations. We ensure all work meets or exceeds local codes, passing inspections the first time."
          },
          {
            title: "Multi-Tenant & Multi-Location",
            description: "Coordinated service for multi-unit buildings and businesses with multiple locations. Consistent quality and service across all your properties."
          }
        ]}
        faqs={faqs}
        relatedServices={[
          { title: "Drain Cleaning", path: "/drain-cleaning" },
          { title: "Backflow Services", path: "/backflow" },
          { title: "Gas Services", path: "/gas-line-services" },
          { title: "Water Heater Services", path: "/water-heater-services" }
        ]}
        blogCategory="Commercial"
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
