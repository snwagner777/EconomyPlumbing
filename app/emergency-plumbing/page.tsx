import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServicePage from "@/components/ServicePage";

/**
 * Emergency Plumbing Services Page - Server Component with SEO
 * 
 * Metadata and JSON-LD rendered server-side for proper SEO
 * Phone numbers server-rendered for crawlers, upgraded client-side for tracking
 */

interface EmergencyPlumbingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/emergency-plumbing', {
    title: '24/7 Emergency Plumber Austin TX | Fast Response Service',
    description: 'Emergency plumbing service available 24/7 in Austin. Fast response for burst pipes, sewer backups & major leaks. Nights/weekends/holidays. Call (512) 368-9159.',
    ogImage: 'https://www.plumbersthatcare.com/attached_assets/optimized/Emergency_plumbing_service_arrival_3f78c39e.webp',
    ogType: 'website',
  });
}

const faqs = [
  {
    question: "What constitutes a plumbing emergency?",
    answer: "Plumbing emergencies include burst pipes, sewer backups, gas leaks, no hot water in winter, toilet overflows, and any situation causing active water damage or safety hazards. If you're unsure, call us - we'll help determine the urgency."
  },
  {
    question: "Do you charge extra for emergency service?",
    answer: "We provide upfront pricing before starting work, so you know exactly what to expect. While emergency calls may have premium rates for after-hours service, we never surprise you with hidden fees. We discuss all costs before proceeding."
  },
  {
    question: "How fast can you respond to emergencies?",
    answer: "We typically respond to emergencies within 1-2 hours, often faster for severe situations. Response times may vary based on location and current call volume, but we always prioritize emergency situations."
  },
  {
    question: "What should I do while waiting for emergency service?",
    answer: "For water emergencies: shut off the main water valve if possible and remove valuables from affected areas. For gas leaks: evacuate immediately and call 911. For sewer backups: avoid using plumbing and keep family/pets away. We'll provide specific guidance when you call."
  },
  {
    question: "Are you available on holidays?",
    answer: "Yes, we provide emergency service 365 days a year, including all major holidays. Plumbing emergencies don't take days off, and neither do we when our customers need us."
  },
  {
    question: "Will you help with insurance claims?",
    answer: "Absolutely. We provide detailed documentation including photos, findings, and repair details to support insurance claims. We can also work directly with your insurance adjuster to ensure proper coverage."
  }
];

export default async function EmergencyPlumbing({ searchParams }: EmergencyPlumbingPageProps) {
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
  const canonical = 'https://www.plumbersthatcare.com/emergency';
  const serviceSchema = createServiceSchema(
    'Emergency Plumbing Services',
    'Emergency plumbing service available 24/7 in Austin. Fast response for burst pipes, sewer backups & major leaks.',
    canonical
  );
  const faqSchema = createFAQSchema(faqs);
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Services", url: "https://www.plumbersthatcare.com/services" },
    { name: "Emergency Plumbing Services", url: canonical }
  ]);
  
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Client component with interactive features */}
      <ServicePage
        title="24/7 Emergency Plumber Austin TX | Fast Response Service"
        metaDescription="Emergency plumbing service available 24/7 in Austin. Fast response for burst pipes, sewer backups & major leaks. Nights/weekends/holidays. Call (512) 368-9159."
        canonical={canonical}
        heroImage="/attached_assets/optimized/Emergency_plumbing_service_arrival_3f78c39e.webp"
        heroImageAlt="24/7 emergency plumbing service in Austin and Marble Falls TX"
        heroTitle="Emergency Plumbing Services"
        heroSubtitle="24/7 Fast Response in Austin & Marble Falls"
        overviewTitle="When You Need Help Most"
        overviewDescription="Plumbing emergencies don't wait for business hours. Our emergency plumbing services are available 24/7, including nights, weekends, and holidays. We respond quickly with fully-stocked trucks to resolve your emergency and minimize damage."
        benefits={[
          "24/7 availability",
          "Rapid response time",
          "Nights & weekends",
          "Holiday service",
          "Fully-stocked trucks",
          "Upfront pricing",
          "Licensed technicians",
          "Insurance documentation"
        ]}
        featuresTitle="Our Emergency Services"
        features={[
          {
            title: "Fast Emergency Response",
            description: "We prioritize emergency calls and typically arrive within 1-2 hours. For severe situations, we can often respond even faster. Our goal is to stop the damage and restore your plumbing quickly."
          },
          {
            title: "Burst Pipe Repair",
            description: "Immediate response to burst pipes with water shutoff, damage mitigation, and expert repairs. We work quickly to stop flooding and restore water service with permanent solutions."
          },
          {
            title: "Water Heater Emergencies",
            description: "Emergency repair or replacement of failed water heaters, including leaking tanks and complete failures. Same-day water heater replacement available when needed."
          },
          {
            title: "Sewer Backup Cleanup",
            description: "Emergency response to sewer backups and drain failures. We quickly identify the cause, clear the blockage, and sanitize affected areas to restore safe, functional plumbing."
          }
        ]}
        faqs={faqs}
        relatedServices={[
          { title: "Water Heater Services", path: "/water-heater-services" },
          { title: "Leak Repair", path: "/leak-repair" },
          { title: "Drain Cleaning", path: "/drain-cleaning" },
          { title: "Commercial Plumbing", path: "/commercial-plumbing" }
        ]}
        phoneConfig={austin}
        marbleFallsPhoneConfig={marbleFalls}
      />
    </>
  );
}
