import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema, createBreadcrumbListSchema } from "@/components/SEO/JsonLd";
import ServicePage from "@/components/ServicePage";
import CommercialCustomersShowcase from "@/components/CommercialCustomersShowcase";

interface GasServicesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/gas-services', {
    title: 'Gas Line Installation & Repair Austin TX | Licensed',
    description: 'Professional gas line installation for appliances, outdoor kitchens, fire pits & generators in Austin. Licensed gas fitters. Call (512) 368-9159 today.',
    ogType: 'website',
  });
}

const faqs = [
  {
    question: "How do I know if I have a gas leak?",
    answer: "Signs of a gas leak include the smell of rotten eggs (added to natural gas for detection), hissing sounds near gas lines, dead plants near gas lines, and physical symptoms like dizziness or nausea. If you suspect a leak, evacuate immediately and call 911, then contact us for emergency repair."
  },
  {
    question: "Can I install a gas line myself?",
    answer: "No. Gas line work must be performed by licensed professionals for safety and code compliance. Improper installation can lead to leaks, fires, explosions, and carbon monoxide poisoning. Our certified technicians ensure safe, code-compliant installations."
  },
  {
    question: "How much does gas line installation cost?",
    answer: "Costs vary based on distance, complexity, and local codes. Simple appliance hookups may start around $200-300, while extensive new gas line installations can range from $500-2,000+. We provide free, detailed estimates with no obligation."
  },
  {
    question: "Do you work with propane and natural gas?",
    answer: "Yes, we service both natural gas and propane (LP) systems. Our technicians are trained on both fuel types and understand the specific requirements and safety considerations for each."
  },
  {
    question: "Can you convert appliances from propane to natural gas?",
    answer: "Yes, we can convert most appliances from propane to natural gas or vice versa. This involves installing conversion kits and adjusting regulators. We'll assess your specific appliances and provide guidance on conversion feasibility and costs."
  },
  {
    question: "How often should gas lines be inspected?",
    answer: "We recommend annual gas line inspections, especially for older homes or if you're buying a new home. Regular inspections identify potential issues before they become dangerous and ensure your system operates safely and efficiently."
  }
];

export default async function GasServices({ searchParams }: GasServicesPageProps) {
  await searchParams;
  const { phoneConfig, marbleFallsPhoneConfig } = await getPhoneNumbers();

  const serviceSchema = createServiceSchema({
    name: "Gas Line Services",
    description: "Professional gas line installation for appliances, outdoor kitchens, fire pits & generators in Austin. Licensed gas fitters providing safe, code-compliant installations.",
    areaServed: [
      { name: "Austin", type: "City" },
      { name: "Marble Falls", type: "City" },
      { name: "Cedar Park", type: "City" },
      { name: "Round Rock", type: "City" },
      { name: "Georgetown", type: "City" },
      { name: "Leander", type: "City" }
    ],
  });

  const faqSchema = createFAQSchema(faqs);

  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", item: "https://www.plumbersthatcare.com" },
    { name: "Gas Services", item: "https://www.plumbersthatcare.com/gas-services" }
  ]);

  return (
    <>
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
      <ServicePage
        title="Gas Line Installation & Repair Austin TX | Licensed"
        metaDescription="Professional gas line installation for appliances, outdoor kitchens, fire pits & generators in Austin. Licensed gas fitters. Call (512) 368-9159 today."
        canonical="https://www.plumbersthatcare.com/gas-line-services"
        heroImage="/attached_assets/optimized/gas_line_installatio_9713d531.webp"
        heroImageAlt="Licensed gas line installation and repair service in Austin and Marble Falls TX"
        heroTitle="Gas Line Services"
        heroSubtitle="Licensed Gas Line Installation, Repair & Safety Inspections"
        overviewTitle="Professional Gas Line Services"
        overviewDescription="Safety is our top priority when working with gas lines. Our licensed and certified gas technicians provide expert installation, repair, and inspection services for all your gas line needs, from new appliance hookups to emergency leak repairs."
        customSection={<CommercialCustomersShowcase />}
        benefits={[
          "Licensed gas technicians",
          "Safety inspections",
          "Gas line installation",
          "Gas leak detection & repair",
          "Appliance hookups",
          "Emergency gas service",
          "Code compliant work",
          "Pressure testing"
        ]}
        featuresTitle="Our Gas Line Services"
        features={[
          {
            title: "Gas Line Installation",
            description: "Professional installation of new gas lines for appliances, outdoor kitchens, fire pits, pool heaters, and generators. All work meets or exceeds local codes and safety standards."
          },
          {
            title: "Gas Leak Repair",
            description: "Immediate response to gas leaks with electronic leak detection and expert repairs. We locate and fix leaks quickly and safely, ensuring your home's safety is never compromised."
          },
          {
            title: "Appliance Hookups",
            description: "Safe installation and hookup of gas appliances including ranges, dryers, water heaters, furnaces, and fireplaces. Proper installation ensures efficient operation and safety."
          },
          {
            title: "Safety Inspections",
            description: "Comprehensive gas line safety inspections including pressure testing and leak detection. We identify potential hazards before they become emergencies and provide detailed reports."
          }
        ]}
        faqs={faqs}
        relatedServices={[
          { title: "Water Heater Services", path: "/water-heater-services" },
          { title: "Commercial Plumbing", path: "/commercial-plumbing" },
          { title: "Leak Repair", path: "/leak-repair" },
          { title: "Gas Leak Detection", path: "/gas-leak-detection" }
        ]}
        reviewsCategory="gas"
        reviewsTitle="Gas Line Services Customer Reviews"
        blogCategory="Maintenance"
        phoneConfig={phoneConfig}
        marbleFallsPhoneConfig={marbleFallsPhoneConfig}
      />
    </>
  );
}
