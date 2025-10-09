import ServicePage from "@/components/ServicePage";
import drainImage from "@assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp";

export default function DrainCleaning() {
  return (
    <ServicePage
      title="Drain Cleaning Austin & Marble Falls | Economy Plumbing"
      metaDescription="Austin & Marble Falls drain cleaning, water heater & sewer services. Video inspection, hydro jetting, root removal. Same-day service. Call (512) 368-9159."
      canonical="https://www.plumbersthatcare.com/drain-cleaning"
      heroImage={drainImage}
      heroImageAlt="Professional drain cleaning and sewer line service in Austin and Marble Falls TX"
      heroTitle="Drain Cleaning Services"
      heroSubtitle="Professional Drain & Sewer Line Solutions in Central Texas"
      overviewTitle="Expert Drain Cleaning Solutions"
      overviewDescription="From simple clogs to complex sewer line issues, our professional drain cleaning services keep your plumbing flowing smoothly. We use advanced equipment including video inspection and hydro jetting for thorough, lasting results."
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
      faqs={[
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
      ]}
      relatedServices={[
        { title: "Water Heater Services", path: "/water-heater-services" },
        { title: "Leak Repair", path: "/leak-repair" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Hydro Jetting", path: "/hydro-jetting-services" }
      ]}
      reviewsCategory="drain"
      reviewsTitle="Drain Cleaning Customer Reviews"
      blogCategory="Drain Cleaning"
    />
  );
}
