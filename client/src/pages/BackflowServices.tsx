import ServicePage from "@/components/ServicePage";
import backflowImage from "@assets/generated_images/Plumber_installing_water_heater_3f7d8a09.png";

export default function BackflowServices() {
  return (
    <ServicePage
      title="Backflow Testing & Prevention | Certified Technicians"
      metaDescription="Certified backflow testing, repair, and prevention in Austin & Marble Falls. Annual testing, city compliance, backflow preventer installation. Licensed & certified technicians."
      heroImage={backflowImage}
      heroImageAlt="Certified backflow testing and prevention service in Austin and Marble Falls TX"
      heroTitle="Backflow Prevention Services"
      heroSubtitle="Certified Testing, Repair & Installation for Clean Water Safety"
      overviewTitle="Professional Backflow Prevention Services"
      overviewDescription="Protect your drinking water with certified backflow prevention services. Our licensed backflow testers provide annual testing, repairs, and new installations to ensure your water stays clean and meets all city requirements."
      benefits={[
        "Certified backflow testers",
        "Annual testing services",
        "City compliance assistance",
        "Backflow preventer installation",
        "Repair & replacement",
        "Test report filing",
        "Commercial & residential",
        "Same-day service available"
      ]}
      featuresTitle="Our Backflow Services"
      features={[
        {
          title: "Annual Backflow Testing",
          description: "State-certified testing of backflow prevention devices to ensure proper operation and compliance with city regulations. We file all required paperwork with your local water utility."
        },
        {
          title: "Backflow Preventer Installation",
          description: "Professional installation of backflow prevention devices for irrigation systems, fire sprinklers, commercial facilities, and other applications where backflow prevention is required."
        },
        {
          title: "Backflow Repair & Replacement",
          description: "Expert repair or replacement of failed backflow preventers. We diagnose issues, provide cost comparisons for repair vs. replacement, and ensure your device meets current code requirements."
        },
        {
          title: "City Compliance Assistance",
          description: "Complete assistance with city backflow requirements including device registration, annual testing notifications, and filing of test reports. We handle the paperwork so you don't have to."
        }
      ]}
      faqs={[
        {
          question: "What is backflow and why is it dangerous?",
          answer: "Backflow occurs when water flows backward in your plumbing, potentially contaminating clean drinking water with chemicals, bacteria, or other hazards. Backflow preventers protect public water supplies from contamination and are required by most municipalities."
        },
        {
          question: "How often does my backflow preventer need testing?",
          answer: "Most cities require annual testing of backflow prevention devices. You'll typically receive a notice from your water utility. Failure to test can result in fines or water service disconnection."
        },
        {
          question: "Who can perform backflow testing?",
          answer: "Only state-certified backflow prevention assembly testers can perform official testing. All our backflow testers are properly certified and licensed to test and repair devices."
        },
        {
          question: "Do I need a backflow preventer?",
          answer: "Backflow preventers are required for irrigation systems, fire sprinkler systems, commercial facilities, and any situation where non-potable water could enter the drinking water supply. Your local water utility can confirm requirements for your property."
        },
        {
          question: "What happens if my backflow preventer fails testing?",
          answer: "If your device fails, it must be repaired or replaced to pass testing. We'll provide a detailed explanation of the failure, cost estimates for repair vs. replacement, and complete the work quickly to ensure compliance."
        },
        {
          question: "How much does backflow testing cost?",
          answer: "Annual testing typically costs $75-150 depending on the device type and location. Installation of new devices ranges from $300-1,500+ depending on size and complexity. We provide upfront pricing before any work begins."
        }
      ]}
      relatedServices={[
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Leak Repair Services", path: "/leak-repair" },
        { title: "Toilet & Faucet Services", path: "/toilet-faucet" },
        { title: "Water Heater Services", path: "/water-heater-services" }
      ]}
    />
  );
}
