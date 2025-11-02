import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema, createBreadcrumbListSchema } from "@/components/SEO/JsonLd";
import ServicePage from "@/components/ServicePage";

interface DrainageSolutionsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/drainage-solutions', {
    title: 'Drain Pipe Repair Austin TX | Cast Iron Pipe Specialists',
    description: 'Expert drainage pipe repair & replacement in Austin. Cast iron pipe specialists, sewer line repair & broken pipe fixes. Trenchless options. Call (512) 368-9159.',
    ogType: 'website',
  });
}

const faqs = [
  {
    question: "How do I know if my drain pipes need replacement?",
    answer: "Signs include recurring clogs, slow draining throughout the house, foul odors, water backing up in multiple fixtures, visible corrosion on exposed pipes, or age (cast iron pipes over 50 years old often need replacement). We can inspect your system and provide an honest assessment."
  },
  {
    question: "What types of drain pipes do you work with?",
    answer: "We repair and replace all types including cast iron, galvanized steel, PVC, ABS, copper, and clay pipes. We can also upgrade older pipe materials to modern PVC or ABS systems that resist corrosion and provide better flow."
  },
  {
    question: "How much does drain pipe replacement cost?",
    answer: "Costs vary based on pipe location, length, material, and accessibility. Simple accessible replacements may start around $500-1,500, while main sewer line replacements can range from $3,000-10,000+ depending on length and method. We provide detailed free estimates."
  },
  {
    question: "Do you offer trenchless pipe replacement?",
    answer: "Yes, we offer trenchless pipe bursting and pipe lining options for certain situations. These methods can replace or repair pipes with minimal excavation, preserving your landscaping and reducing restoration costs. We'll evaluate if your system is a good candidate."
  },
  {
    question: "How long does drain pipe replacement take?",
    answer: "Simple drain line replacements typically take 4-8 hours. Main sewer line replacements can take 1-3 days depending on length, depth, and site conditions. We work efficiently and communicate timeline expectations upfront."
  },
  {
    question: "Can you repair just a section of pipe?",
    answer: "Yes, if the damage is localized and the rest of the system is in good condition, we can replace just the affected section. However, if the system is old or showing widespread deterioration, we may recommend replacing larger sections to avoid repeated repairs."
  }
];

export default async function DrainageSolutions({ searchParams }: DrainageSolutionsPageProps) {
  await searchParams;
  const { phoneConfig, marbleFallsPhoneConfig } = await getPhoneNumbers();

  const serviceSchema = createServiceSchema({
    name: "Drainage Pipe Services",
    description: "Expert drainage pipe repair & replacement in Austin. Cast iron pipe specialists, sewer line repair & broken pipe fixes. Trenchless options available.",
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
    { name: "Drainage Solutions", item: "https://www.plumbersthatcare.com/drainage-solutions" }
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
        title="Drain Pipe Repair Austin TX | Cast Iron Pipe Specialists"
        metaDescription="Expert drainage pipe repair & replacement in Austin. Cast iron pipe specialists, sewer line repair & broken pipe fixes. Trenchless options. Call (512) 368-9159."
        canonical="https://www.plumbersthatcare.com/drainage-solutions"
        heroImage="/attached_assets/optimized/outdoor_drainage_sys_77a8cb62.webp"
        heroImageAlt="Professional drainage pipe repair and replacement services in Central Texas"
        heroTitle="Drainage Pipe Services"
        heroSubtitle="Expert Drain Line Repair, Replacement & Installation"
        overviewTitle="Professional Drainage Pipe Solutions"
        overviewDescription="Damaged or clogged drainage pipes can cause backups, slow drains, and water damage throughout your home or business. Our drainage experts diagnose and repair all types of plumbing drain lines, from kitchen sinks to main sewer lines."
        benefits={[
          "Complete drain line inspection",
          "Broken pipe replacement",
          "Cast iron pipe replacement",
          "PVC drain installation",
          "Sewer line repair",
          "Underground pipe location",
          "Trenchless pipe repair options",
          "Free drainage assessment"
        ]}
        featuresTitle="Our Drainage Pipe Services"
        features={[
          {
            title: "Drain Line Repair & Replacement",
            description: "Expert repair and replacement of all types of drain lines including kitchen drains, bathroom drains, laundry lines, and floor drains. We handle cracked pipes, broken connections, and failing drain systems with modern materials and proven techniques."
          },
          {
            title: "Cast Iron Pipe Replacement",
            description: "Specialized in replacing old cast iron drain pipes that have corroded, rusted, or failed. We upgrade your system to modern PVC or ABS piping that won't rust and provides superior flow and longevity."
          },
          {
            title: "Main Sewer Line Services",
            description: "Complete main sewer line inspection, repair, and replacement. We use video camera inspection to diagnose issues and can perform traditional excavation or trenchless pipe bursting depending on your needs and budget."
          },
          {
            title: "Underground Drain Pipes",
            description: "Locate and repair underground drainage pipes using advanced detection equipment. We handle collapsed pipes, root intrusion, and broken underground lines that cause recurring clogs or slow drainage throughout your property."
          }
        ]}
        faqs={faqs}
        relatedServices={[
          { title: "Drain Cleaning", path: "/drain-cleaning" },
          { title: "Rooter Services", path: "/rooter-services" },
          { title: "Water Leak Repair", path: "/water-leak-repair" },
          { title: "Hydro Jetting", path: "/hydro-jetting-services" }
        ]}
        reviewsCategory="drain"
        reviewsTitle="Drainage Pipe Service Customer Reviews"
        phoneConfig={phoneConfig}
        marbleFallsPhoneConfig={marbleFallsPhoneConfig}
      />
    </>
  );
}
