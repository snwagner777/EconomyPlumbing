import ServicePage from "@/components/ServicePage";
import faucetImage from "@assets/generated_images/Toilet_and_faucet_installation_18dec30d.png";

export default function FaucetInstallation() {
  return (
    <ServicePage
      title="Faucet Installation & Repair | Kitchen & Bath Faucet Replacement TX"
      metaDescription="Austin & Marble Falls faucet installation & repair. Kitchen, bathroom, shower valves. Fix leaks, upgrade fixtures. Same-day service. Call (512) 368-9159."
      canonical="https://economyplumbingservices.com/faucet-installation"
      heroImage={faucetImage}
      heroImageAlt="Professional faucet installation and repair service in Central Texas"
      heroTitle="Faucet Installation & Repair"
      heroSubtitle="Kitchen, Bathroom & Shower Faucet Services"
      overviewTitle="Professional Faucet Services"
      overviewDescription="From dripping faucets to complete fixture upgrades, our experienced plumbers handle all your faucet needs. We install and repair all brands and styles of kitchen faucets, bathroom faucets, and shower valves with precision and care."
      benefits={[
        "Expert faucet installation",
        "All brands serviced",
        "Leak repair specialists",
        "Fixture upgrades",
        "Quality workmanship",
        "Warranty on parts & labor",
        "Clean, professional service",
        "Same-day availability"
      ]}
      featuresTitle="Our Faucet Services"
      features={[
        {
          title: "Faucet Installation",
          description: "Professional installation of new kitchen and bathroom faucets. We handle everything from standard single-handle faucets to high-end fixtures with pull-down sprayers, touchless operation, and pot fillers."
        },
        {
          title: "Faucet Repair",
          description: "Expert repair of leaking, dripping, or malfunctioning faucets. We fix cartridge failures, worn washers, corroded parts, and handle all types of faucets including compression, ball, cartridge, and ceramic disc."
        },
        {
          title: "Shower Valve Service",
          description: "Installation and repair of shower valves and trim kits. We fix temperature control issues, replace worn cartridges, and upgrade to thermostatic or pressure-balanced valves for safety and comfort."
        },
        {
          title: "Fixture Upgrades",
          description: "Upgrade outdated faucets with modern, water-efficient models. We'll help you select fixtures that match your style and budget, then provide professional installation with proper sealing and connections."
        }
      ]}
      faqs={[
        {
          question: "How much does faucet installation cost?",
          answer: "Basic faucet installation typically runs $150-250 for labor, plus the cost of the fixture. More complex installations with additional lines or modifications may cost more. We provide upfront pricing before starting work."
        },
        {
          question: "Can you install a faucet I purchased myself?",
          answer: "Yes, we can install customer-supplied faucets. However, we recommend purchasing through us when possible as we can ensure compatibility, warranty coverage, and stand behind both the fixture and installation."
        },
        {
          question: "How long does faucet installation take?",
          answer: "Most faucet installations take 1-2 hours, including removal of the old faucet, cleanup, and testing. Complex installations or those requiring additional work may take longer."
        },
        {
          question: "Should I repair or replace my faucet?",
          answer: "We generally recommend repair if the faucet is less than 10 years old and the repair cost is under 50% of replacement. For older faucets or extensive damage, replacement is often more cost-effective and provides better long-term value."
        },
        {
          question: "Do you work with all faucet brands?",
          answer: "Yes, we install and repair all major brands including Moen, Delta, Kohler, American Standard, Grohe, Pfister, and more. Our technicians are familiar with the unique features and requirements of each brand."
        },
        {
          question: "What's included in your faucet installation warranty?",
          answer: "We provide a one-year warranty on our installation workmanship. Manufacturer warranties on parts vary by brand but typically range from 1 year to lifetime. We'll explain all warranty coverage before installation."
        }
      ]}
      relatedServices={[
        { title: "Toilet & Faucet", path: "/toilet-faucet" },
        { title: "Leak Repair", path: "/leak-repair" },
        { title: "Water Pressure Solutions", path: "/water-pressure-solutions" },
        { title: "Garbage Disposal Repair", path: "/garbage-disposal-repair" }
      ]}
    />
  );
}
