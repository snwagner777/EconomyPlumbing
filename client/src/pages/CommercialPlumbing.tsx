import ServicePage from "@/components/ServicePage";
import commercialImage from "@assets/generated_images/Commercial_plumbing_services_bd7b6306.png";

export default function CommercialPlumbing() {
  return (
    <ServicePage
      title="Commercial Plumbing Services | Austin & Marble Falls Businesses"
      metaDescription="Professional commercial plumbing services in Austin & Marble Falls. Scheduled maintenance, emergency repairs, code compliance. Serving restaurants, offices, retail & more."
      heroImage={commercialImage}
      heroImageAlt="Professional commercial plumbing services for businesses in Austin and Marble Falls TX"
      heroTitle="Commercial Plumbing Services"
      heroSubtitle="Professional Plumbing Solutions for Central Texas Businesses"
      overviewTitle="Comprehensive Commercial Plumbing"
      overviewDescription="Keep your business running smoothly with reliable commercial plumbing services. From routine maintenance to emergency repairs, we provide fast, professional service that minimizes downtime and keeps your operations flowing."
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
      faqs={[
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
      ]}
      relatedServices={[
        { title: "Emergency Services", path: "/emergency" },
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Backflow Services", path: "/backflow" },
        { title: "Gas Services", path: "/gas-services" }
      ]}
    />
  );
}
