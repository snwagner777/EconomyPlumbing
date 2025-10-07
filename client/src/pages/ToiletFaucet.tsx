import ServicePage from "@/components/ServicePage";
import toiletImage from "@assets/optimized/Toilet_and_faucet_installation_18dec30d.webp";

export default function ToiletFaucet() {
  return (
    <ServicePage
      title="Toilet & Faucet Repair & Installation | Economy Plumbing"
      metaDescription="Austin & Marble Falls toilet & faucet repair, installation, replacement. Modern fixtures, water-saving options. Same-day service. Call (512) 368-9159."
      canonical="https://economyplumbingservices.com/toilet-faucet"
      heroImage={toiletImage}
      heroImageAlt="Professional toilet and faucet installation and repair in Austin and Marble Falls TX"
      heroTitle="Toilet & Faucet Services"
      heroSubtitle="Professional Installation, Repair & Replacement Services"
      overviewTitle="Complete Toilet & Faucet Solutions"
      overviewDescription="From simple repairs to complete fixture upgrades, we provide expert toilet and faucet services. Whether you're dealing with a running toilet, dripping faucet, or want to install modern, water-efficient fixtures, we've got you covered."
      benefits={[
        "Same-day repairs available",
        "Modern fixture installation",
        "Water-saving options",
        "All brands serviced",
        "Quick repair service",
        "Fixture upgrades",
        "Licensed technicians",
        "Warranty on installations"
      ]}
      featuresTitle="Our Toilet & Faucet Services"
      features={[
        {
          title: "Toilet Repair & Installation",
          description: "Complete toilet services including repair of running toilets, weak flushes, and leaks. Expert installation of new toilets including modern low-flow and dual-flush models."
        },
        {
          title: "Faucet Repair & Replacement",
          description: "Fix dripping faucets, low water pressure, and handle problems. Professional installation of kitchen and bathroom faucets in all styles including touchless and pull-down models."
        },
        {
          title: "Water-Efficient Fixtures",
          description: "Upgrade to EPA WaterSense certified toilets and faucets to reduce water usage by up to 60% while maintaining excellent performance. Save money and help the environment."
        },
        {
          title: "Fixture Upgrades",
          description: "Transform your bathroom or kitchen with modern fixture upgrades. We install all styles from traditional to contemporary, and help you select fixtures that match your décor and budget."
        }
      ]}
      faqs={[
        {
          question: "How do I stop a toilet from running constantly?",
          answer: "A running toilet is usually caused by a faulty flapper valve, fill valve, or overflow tube. While some homeowners can DIY this repair, improper fixes can lead to water waste and higher bills. We provide fast, affordable toilet repairs with guaranteed results."
        },
        {
          question: "Why is my faucet dripping?",
          answer: "Dripping faucets are typically caused by worn washers, O-rings, or valve seats. Even a slow drip can waste thousands of gallons annually. We can quickly diagnose and repair faucet leaks, or recommend replacement if the fixture is old or extensively worn."
        },
        {
          question: "How much water can I save with a low-flow toilet?",
          answer: "Modern WaterSense certified toilets use just 1.28 gallons per flush compared to older toilets that use 3.5-7 gallons. For a family of four, this can save up to 16,000 gallons of water per year and reduce water bills by $110 or more annually."
        },
        {
          question: "Can you match my existing fixtures?",
          answer: "We work with all major fixture manufacturers and can help you find matches for existing fixtures or suggest coordinating alternatives. Bring us photos or model numbers and we'll find the perfect fit for your home."
        },
        {
          question: "How long does toilet or faucet installation take?",
          answer: "Most toilet installations take 1-2 hours, and faucet installations take 1-2 hours depending on the fixture and existing plumbing. We complete most installations in a single visit with minimal disruption."
        },
        {
          question: "Do you haul away old fixtures?",
          answer: "Yes! We include removal and disposal of old toilets and faucets as part of our installation service. We'll leave your bathroom or kitchen clean and ready to use."
        }
      ]}
      relatedServices={[
        { title: "Leak Repair Services", path: "/leak-repair" },
        { title: "Water Heater Services", path: "/water-heater-services" },
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Backflow Services", path: "/backflow" }
      ]}
    />
  );
}
