import ServicePage from "@/components/ServicePage";
import rooterImage from "@assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp";

export default function RooterServices() {
  return (
    <ServicePage
      title="Rooter Service | Sewer & Drain Rooter Cleaning TX"
      metaDescription="Austin & Marble Falls rooter service. Clear tough clogs in drains & sewer lines. Remove tree roots, grease, blockages. 24/7 emergency. (512) 368-9159."
      canonical="https://plumbersthatcare.com/rooter-services"
      heroImage={rooterImage}
      heroImageAlt="Professional rooter service and drain cleaning in Central Texas"
      heroTitle="Rooter Services"
      heroSubtitle="Professional Sewer & Drain Rooter Cleaning"
      overviewTitle="Expert Rooter Services"
      overviewDescription="When drains are completely clogged or backing up, you need professional rooter service. Our experienced technicians use powerful rooter machines to clear the toughest clogs in drains and sewer lines, getting your plumbing flowing again quickly."
      benefits={[
        "Clear tough clogs fast",
        "Remove tree roots",
        "Sewer line cleaning",
        "All drain types serviced",
        "24/7 emergency service",
        "Video inspection available",
        "Preventive maintenance",
        "Same-day service"
      ]}
      featuresTitle="Our Rooter Services"
      features={[
        {
          title: "Sewer Line Rooter Service",
          description: "Powerful rooter machines clear main sewer line clogs caused by tree roots, grease buildup, or foreign objects. We use specialized cutting heads to remove obstructions and restore full flow."
        },
        {
          title: "Drain Line Cleaning",
          description: "Professional rooter service for kitchen drains, bathroom drains, floor drains, and more. Our rooter cables reach deep into pipes to break up and remove clogs that plungers and chemicals can't touch."
        },
        {
          title: "Root Removal",
          description: "Specialized root-cutting attachments remove tree roots that have penetrated sewer lines. We can clear root intrusions and recommend preventive treatments to slow future root growth."
        },
        {
          title: "Emergency Rooter Service",
          description: "24/7 emergency rooter service for sewage backups and completely blocked drains. Fast response to prevent property damage and restore your plumbing to working order."
        }
      ]}
      faqs={[
        {
          question: "What is rooter service?",
          answer: "Rooter service uses specialized rotating cables with cutting heads to break through and remove clogs in drains and sewer lines. It's more powerful than plunging and can clear tough blockages that other methods can't reach."
        },
        {
          question: "How much does rooter service cost?",
          answer: "Basic drain rooter service typically costs $150-300. Main sewer line rooter service ranges from $250-500. Costs vary based on clog severity, accessibility, and whether it's an emergency call. We provide upfront pricing."
        },
        {
          question: "What causes sewer line clogs?",
          answer: "Common causes include tree root intrusion, flushing inappropriate items, grease buildup, broken pipes, and aging sewer lines with sagging or bellies. Video inspection can identify the exact cause."
        },
        {
          question: "Can rooter service damage my pipes?",
          answer: "When performed by trained professionals using proper techniques and equipment, rooter service is safe. We size cables appropriately and use correct cutting heads. Video inspection beforehand helps us identify any fragile pipes."
        },
        {
          question: "How long does rooter service take?",
          answer: "Most rooter service takes 30 minutes to 2 hours depending on clog location and severity. Simple drain clogs clear quickly, while main sewer line obstructions or tree roots may take longer."
        },
        {
          question: "Is rooter service the same as hydro jetting?",
          answer: "No, rooter service uses mechanical cables with cutting heads, while hydro jetting uses high-pressure water. Rooter service is great for breaking through clogs; hydro jetting provides more thorough cleaning. We'll recommend the best method for your situation."
        }
      ]}
      relatedServices={[
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Hydro Jetting", path: "/hydro-jetting-services" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Water Heater Services", path: "/water-heater-services" }
      ]}
      reviewsCategory="drain"
      reviewsTitle="Rooter Service Customer Reviews"
    />
  );
}
