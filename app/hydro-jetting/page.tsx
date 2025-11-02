'use client';
import ServicePage from "@/components/ServicePage";
import CommercialCustomersShowcase from "@/components/CommercialCustomersShowcase";

export default function HydroJetting() {
  return (
    <ServicePage
      title="Hydro Jetting Austin TX | 4,000 PSI Power Cleaning Service"
      metaDescription="Power through tough clogs in Austin with hydro jetting up to 4,000 PSI. Clear grease, tree roots & sewer buildup. Video inspection. Call (512) 368-9159."
      canonical="https://www.plumbersthatcare.com/hydro-jetting-services"
      heroImage="/attached_assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp"
      heroImageAlt="Professional hydro jetting and high-pressure drain cleaning in Central Texas"
      heroTitle="Hydro Jetting Services"
      heroSubtitle="High-Pressure Drain & Sewer Line Cleaning"
      overviewTitle="Professional Hydro Jetting"
      overviewDescription="When traditional snaking isn't enough, hydro jetting provides the most thorough drain and sewer line cleaning available. Using high-pressure water streams up to 4,000 PSI, we completely clear clogs and buildup, restoring your pipes to like-new condition."
      customSection={<CommercialCustomersShowcase />}
      benefits={[
        "Clears toughest clogs",
        "Removes grease & buildup",
        "Cuts tree roots",
        "Eco-friendly cleaning",
        "Long-lasting results",
        "Video inspection available",
        "Commercial & residential",
        "Prevents future clogs"
      ]}
      featuresTitle="Our Hydro Jetting Services"
      features={[
        {
          title: "Sewer Line Jetting",
          description: "Complete cleaning of main sewer lines using high-pressure water to remove years of grease, soap scum, and mineral deposits. Cuts through tree roots and clears even the most stubborn blockages."
        },
        {
          title: "Commercial Drain Cleaning",
          description: "Heavy-duty hydro jetting for commercial kitchens, restaurants, and businesses with severe grease buildup. Regular jetting prevents clogs and maintains optimal flow in high-use drain systems."
        },
        {
          title: "Video Inspection",
          description: "Before and after video inspection to identify issues and verify complete cleaning. See exactly what's blocking your drains and confirm they're completely clear after jetting."
        },
        {
          title: "Preventive Maintenance",
          description: "Regular hydro jetting service to prevent clogs before they happen. Ideal for homes with recurring drain issues, older pipes, or properties with tree roots in sewer lines."
        }
      ]}
      faqs={[
        {
          question: "What is hydro jetting?",
          answer: "Hydro jetting uses high-pressure water (up to 4,000 PSI) delivered through specialized nozzles to completely clean drain and sewer pipes. It's more thorough than traditional snaking, removing all buildup and leaving pipes clean."
        },
        {
          question: "When is hydro jetting recommended?",
          answer: "Hydro jetting is ideal for recurring clogs, slow drains, grease buildup, tree root intrusion, or before pipe lining. It's also recommended for commercial kitchens and properties that haven't had professional drain cleaning in years."
        },
        {
          question: "Will hydro jetting damage my pipes?",
          answer: "When performed by trained professionals, hydro jetting is safe for most pipes. We perform video inspection first to check pipe condition and adjust pressure accordingly. We'll recommend alternatives if pipes are too fragile for jetting."
        },
        {
          question: "How much does hydro jetting cost?",
          answer: "Hydro jetting typically costs $350-600 for residential sewer lines, more for commercial work or extensive cleaning. While more expensive than snaking, it's more thorough and provides longer-lasting results."
        },
        {
          question: "How often should I have hydro jetting done?",
          answer: "For prevention, every 18-24 months for most homes. Restaurants and commercial kitchens may need quarterly or monthly service. Properties with tree roots may benefit from annual jetting to prevent major clogs."
        },
        {
          question: "Can hydro jetting remove tree roots?",
          answer: "Yes, hydro jetting effectively cuts through tree roots in sewer lines. Special nozzles designed for root cutting can clear most root intrusions. However, if roots have caused pipe damage, repair or replacement may be necessary."
        }
      ]}
      relatedServices={[
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Rooter Services", path: "/rooter-services" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Water Heater Services", path: "/water-heater-services" }
      ]}
      reviewsCategory="drain"
      reviewsTitle="Hydro Jetting Customer Reviews"
      blogCategory="Drain Cleaning"
    />
  );
}
