import type { Metadata } from 'next';
import Script from 'next/script';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServicePage from "@/components/ServicePage";
import CommercialCustomersShowcase from "@/components/CommercialCustomersShowcase";

/**
 * Drain Cleaning Services Page - Server Component with SEO
 * 
 * Metadata and JSON-LD rendered server-side for proper SEO
 * Phone numbers server-rendered for crawlers, upgraded client-side for tracking
 */

interface DrainCleaningPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/drain-cleaning', {
    title: 'Drain Cleaning Austin TX | Video Inspection & Hydro',
    description: 'Professional drain cleaning in Austin. Video camera inspection, hydro jetting & root removal. Clear tough clogs fast, same-day service. Call (512) 368-9159.',
    ogImage: 'https://www.plumbersthatcare.com/attached_assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp',
    ogType: 'website',
  });
}

const faqs = [
  {
    question: "How do I know if I need professional drain cleaning?",
    answer: "Signs include slow drains, recurring clogs, gurgling sounds, multiple clogged fixtures, sewage odors, or water backing up. If DIY methods don't work or clogs keep returning, it's time for professional service."
  },
  {
    question: "What's the difference between snaking and hydro jetting?",
    answer: "Snaking uses a cable to break through clogs, which is effective for simple blockages. Hydro jetting uses high-pressure water to completely clean pipe walls, removing all buildup and providing longer-lasting results. We recommend the best method for your specific situation."
  },
  {
    question: "How often should drains be professionally cleaned?",
    answer: "For preventive maintenance, we recommend professional cleaning every 18-24 months. Homes with older plumbing, large trees nearby, or frequent clogs may benefit from annual service."
  },
  {
    question: "Can tree roots really damage my sewer line?",
    answer: "Yes, tree roots are one of the leading causes of sewer line problems. Roots seek out water and can infiltrate even small cracks in pipes, eventually causing major blockages and pipe damage."
  },
  {
    question: "Do you offer emergency drain cleaning?",
    answer: "Absolutely! We provide emergency drain cleaning services for urgent situations like sewage backups or completely blocked drains. Contact us anytime for fast response."
  },
  {
    question: "Is hydro jetting safe for old pipes?",
    answer: "When performed by trained professionals, hydro jetting is safe for most pipes. We first inspect pipes with a camera to assess their condition and adjust pressure accordingly. For severely deteriorated pipes, we'll recommend alternative solutions."
  }
];

export default async function DrainCleaning({ searchParams }: DrainCleaningPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/drain-cleaning';
  const serviceSchema = createServiceSchema(
    'Drain Cleaning Services',
    'Professional drain cleaning in Austin. Video camera inspection, hydro jetting & root removal.',
    canonical
  );
  const faqSchema = createFAQSchema(faqs);
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Services", url: "https://www.plumbersthatcare.com/services" },
    { name: "Drain Cleaning Services", url: canonical }
  ]);
  
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="drain-cleaning-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="drain-cleaning-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="drain-cleaning-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Client component with interactive features */}
      <ServicePage
        title="Drain Cleaning Austin TX | Video Inspection & Hydro"
        metaDescription="Professional drain cleaning in Austin. Video camera inspection, hydro jetting & root removal. Clear tough clogs fast, same-day service. Call (512) 368-9159."
        canonical={canonical}
        heroImage="/attached_assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp"
        heroImageAlt="Professional drain cleaning and sewer line service in Austin and Marble Falls TX"
        heroTitle="Drain Cleaning Services"
        heroSubtitle="Professional Drain & Sewer Line Solutions in Central Texas"
        overviewTitle="Expert Drain Cleaning Solutions"
        overviewDescription="From simple clogs to complex sewer line issues, our professional drain cleaning services keep your plumbing flowing smoothly. We use advanced equipment including video inspection and hydro jetting for thorough, lasting results."
        customSection={<CommercialCustomersShowcase />}
        blogCategory="Drain Cleaning"
        benefits={[
          "Video camera inspection",
          "Hydro jetting technology",
          "Root removal specialists",
          "Sewer line cleaning & repair",
          "Same-day service available",
          "Environmentally safe methods",
          "Preventive maintenance plans",
          "Emergency drain cleaning"
        ]}
        featuresTitle="Our Drain Cleaning Services"
        features={[
          {
            title: "Video Camera Inspection",
            description: "State-of-the-art camera inspection to identify the exact location and cause of clogs or damage in your drain lines. See exactly what's happening inside your pipes."
          },
          {
            title: "Hydro Jetting",
            description: "High-pressure water jetting thoroughly cleans pipes and removes stubborn blockages, grease buildup, and tree roots. More effective and longer-lasting than traditional snaking."
          },
          {
            title: "Root Removal",
            description: "Specialized equipment and techniques to remove tree roots that have invaded your sewer lines. We can also recommend preventive solutions to stop future root intrusion."
          },
          {
            title: "Sewer Line Services",
            description: "Complete sewer line cleaning, repair, and replacement services. We handle everything from minor clogs to major sewer line failures with minimal disruption to your property."
          }
        ]}
        faqs={faqs}
        relatedServices={[
          { title: "Water Heater Services", path: "/water-heater-services" },
          { title: "Leak Repair", path: "/leak-repair" },
          { title: "Commercial Plumbing", path: "/commercial-plumbing" },
          { title: "Hydro Jetting", path: "/hydro-jetting-services" }
        ]}
        reviewsCategory="drain"
        reviewsTitle="Drain Cleaning Customer Reviews"
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
