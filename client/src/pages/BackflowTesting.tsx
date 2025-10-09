import ServicePage from "@/components/ServicePage";
import backflowImage from "@assets/optimized/backflow_preventer_p_c5a67665.webp";

export default function BackflowTesting() {
  return (
    <ServicePage
      title="Backflow Testing Austin & Marble Falls | Economy Plumbing"
      metaDescription="Austin & Marble Falls backflow testing, water heater & plumbing services. Annual testing, installation, repair. City-compliant. Call (512) 368-9159 today."
      canonical="https://www.plumbersthatcare.com/backflow-testing"
      heroImage={backflowImage}
      heroImageAlt="Certified backflow testing and prevention service in Central Texas"
      heroTitle="Backflow Testing & Prevention"
      heroSubtitle="Certified Backflow Testing, Installation & Annual Inspections"
      overviewTitle="Professional Backflow Testing Services"
      overviewDescription="Our certified backflow testers provide comprehensive testing, inspection, and certification services to keep your water supply safe and compliant with local regulations. We handle everything from annual testing to new device installation."
      benefits={[
        "Certified backflow testers",
        "Annual testing & certification",
        "City-compliant reports",
        "Backflow preventer installation",
        "Repair & replacement",
        "Fast turnaround",
        "Online scheduling",
        "Direct city filing"
      ]}
      featuresTitle="Our Backflow Services"
      features={[
        {
          title: "Annual Backflow Testing",
          description: "State-certified testing of backflow prevention devices as required by local water utilities. We test all types of backflow preventers including RPZ, DCVA, PVB, and atmospheric vacuum breakers."
        },
        {
          title: "Backflow Device Installation",
          description: "Professional installation of backflow prevention assemblies for residential, commercial, and irrigation systems. We ensure proper sizing, placement, and compliance with all local codes."
        },
        {
          title: "Backflow Repair & Replacement",
          description: "Expert repair of failed backflow devices or complete replacement when necessary. We stock common parts and can often complete repairs during the same visit."
        },
        {
          title: "Compliance & Reporting",
          description: "We handle all paperwork and submit test results directly to your local water utility. Receive copies of your certification for your records. Never worry about missing deadlines."
        }
      ]}
      faqs={[
        {
          question: "What is backflow and why is testing required?",
          answer: "Backflow occurs when contaminated water flows backward into the clean water supply. Annual testing is required by law to ensure backflow prevention devices are working properly and protecting your drinking water from contamination."
        },
        {
          question: "How often do I need backflow testing?",
          answer: "Most municipalities require annual backflow testing. You'll receive a notice from your water utility when testing is due. It's important to complete testing by the deadline to avoid fines or water service interruption."
        },
        {
          question: "How long does backflow testing take?",
          answer: "Most backflow tests take 15-30 minutes per device. We'll test the device, make minor adjustments if needed, and provide you with immediate results and certification paperwork."
        },
        {
          question: "What if my backflow device fails testing?",
          answer: "If your device fails, we'll explain the issue and provide repair options. Many failures can be fixed on the spot with minor repairs or part replacements. If replacement is needed, we'll provide a detailed estimate."
        },
        {
          question: "Do you file the test results with the city?",
          answer: "Yes! We submit all test results directly to your local water utility and provide you with copies for your records. You don't have to worry about any paperwork or filing deadlines."
        },
        {
          question: "Can you test commercial backflow devices?",
          answer: "Absolutely. Our certified testers work on all types of commercial and industrial backflow prevention assemblies, including large RPZ valves, fire line backflow preventers, and complex irrigation systems."
        }
      ]}
      relatedServices={[
        { title: "Backflow Services", path: "/backflow" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Water Pressure Solutions", path: "/water-pressure-solutions" },
        { title: "Permit Resolution", path: "/permit-resolution-services" }
      ]}
      reviewsCategory="backflow"
      reviewsTitle="Backflow Testing Customer Reviews"
      blogCategory="Backflow Testing"
    />
  );
}
