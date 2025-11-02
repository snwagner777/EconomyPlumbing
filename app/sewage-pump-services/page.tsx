import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';
import ServicePage from "@/components/ServicePage";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/sewage-pump-services', {
    title: 'Sump Pump Installation Austin TX | Expert Flood Prevention',
    description: 'Protect your Austin home with expert sump pump & sewage ejector pump services. Installation, repair & battery backup systems available. Call (512) 368-9159.',
    ogImage: 'https://www.plumbersthatcare.com/attached_assets/optimized/sewage_pump_sump_pum_ab93819a.webp',
    ogType: 'website',
  });
}

export default async function SewagePumpServices() {
  const phoneConfig = await getPhoneNumbers();

  const faqs = [
    {
      question: "How do I know if my sump pump is working?",
      answer: "Test your sump pump monthly by pouring water into the basin until the float rises and the pump activates. The pump should turn on, discharge water, and shut off automatically. If it doesn't, call us for service."
    },
    {
      question: "How long do sump pumps last?",
      answer: "Quality sump pumps typically last 7-10 years. Pumps that run frequently or are in harsh environments may need replacement sooner. Regular maintenance extends pump life and ensures reliability."
    },
    {
      question: "Do I need a battery backup sump pump?",
      answer: "Battery backup systems are highly recommended, especially in areas prone to power outages. Many heavy rains that cause flooding also knock out power. A backup system provides protection when you need it most."
    },
    {
      question: "What's the difference between a sump pump and sewage pump?",
      answer: "Sump pumps handle clear groundwater from foundations and basements. Sewage ejector pumps handle waste water from below-grade toilets and drains. Sewage pumps are designed to handle solids and are more robust."
    },
    {
      question: "How much does sump pump installation cost?",
      answer: "Basic sump pump installation costs $800-1,500 including pump, basin, and discharge piping. Battery backup systems add $400-800. Costs vary based on basement accessibility, discharge requirements, and pump quality."
    },
    {
      question: "Can you install a sump pump alarm?",
      answer: "Yes, we install high-water alarms that alert you if your pump fails or can't keep up with water flow. Some systems send alerts to your phone, providing peace of mind when you're away from home."
    }
  ];

  const serviceSchema = createServiceSchema(
    "Sump & Sewage Pump Services",
    "Professional sump pump and sewage ejector pump installation, repair, and maintenance services. Protect your home from flooding and sewage backups.",
    "https://www.plumbersthatcare.com/sewage-pump-services"
  );

  const faqSchema = createFAQSchema(faqs);

  const breadcrumbs = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Services", url: "https://www.plumbersthatcare.com/services" },
    { name: "Sump & Sewage Pump Services", url: "https://www.plumbersthatcare.com/sewage-pump-services" }
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <ServicePage
        title="Sump Pump Installation Austin TX | Expert Flood Prevention"
        metaDescription="Protect your Austin home with expert sump pump & sewage ejector pump services. Installation, repair & battery backup systems available. Call (512) 368-9159."
        canonical="https://www.plumbersthatcare.com/sewage-pump-services"
        heroImage="/attached_assets/optimized/sewage_pump_sump_pum_ab93819a.webp"
        heroImageAlt="Professional sump pump and sewage pump services in Central Texas"
        heroTitle="Sump & Sewage Pump Services"
        heroSubtitle="Installation, Repair & Maintenance of All Pump Systems"
        overviewTitle="Professional Pump Services"
        overviewDescription="Protect your home from flooding and sewage backups with properly functioning pumps. Our experienced technicians install, repair, and maintain sump pumps, sewage ejector pumps, and grinder pumps to keep your property dry and safe."
        benefits={[
          "Expert pump installation",
          "Emergency pump repair",
          "Battery backup systems",
          "All pump types serviced",
          "Prevent basement flooding",
          "Alarm systems available",
          "24/7 emergency service",
          "Annual maintenance plans"
        ]}
        featuresTitle="Our Pump Services"
        features={[
          {
            title: "Sump Pump Installation",
            description: "Complete sump pump system installation including basin excavation, pump setup, discharge piping, and check valve installation. Battery backup systems available for continued protection during power outages."
          },
          {
            title: "Sewage Ejector Pumps",
            description: "Installation and repair of sewage ejector pumps for basement bathrooms, laundry rooms, and below-grade plumbing fixtures. We size pumps correctly and ensure reliable operation."
          },
          {
            title: "Pump Repair & Replacement",
            description: "Fast repair of failed pumps including motor replacement, float switch repair, and check valve replacement. When repair isn't cost-effective, we provide complete pump replacement."
          },
          {
            title: "Preventive Maintenance",
            description: "Annual pump testing and maintenance to prevent failures. We test float switches, clean basins, check discharge lines, and verify backup systems to ensure pumps work when you need them."
          }
        ]}
        faqs={faqs}
        relatedServices={[
          { title: "Drainage Solutions", path: "/drainage-solutions" },
          { title: "Water Leak Repair", path: "/water-leak-repair" },
          { title: "Leak Repair Services", path: "/leak-repair" },
          { title: "Commercial Plumbing", path: "/commercial-plumbing" }
        ]}
        reviewsCategory="sewer"
        reviewsTitle="Sump & Sewage Pump Customer Reviews"
        blogCategory="Maintenance"
        phoneConfig={phoneConfig}
      />
    </>
  );
}
