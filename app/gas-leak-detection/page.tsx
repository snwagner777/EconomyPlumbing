'use client';
import ServicePage from "@/components/ServicePage";

export default function GasLeakDetection() {
  return (
    <ServicePage
      title="Gas Leak Detection Austin TX | 24/7 Emergency Service"
      metaDescription="Immediate gas leak detection & repair in Austin. Electronic equipment, licensed gas technicians, 24/7 emergency response. Call (512) 368-9159 for safety."
      canonical="https://www.plumbersthatcare.com/gas-leak-detection"
      heroImage="/attached_assets/optimized/gas_line_installatio_9713d531.webp"
      heroImageAlt="Professional gas leak detection and emergency repair service in Central Texas"
      heroTitle="Gas Leak Detection & Repair"
      heroSubtitle="24/7 Emergency Gas Leak Service & Detection"
      overviewTitle="Emergency Gas Leak Services"
      overviewDescription="Gas leaks are serious emergencies requiring immediate professional attention. Our licensed gas technicians use advanced electronic leak detection equipment to quickly locate and repair gas leaks, ensuring your safety."
      benefits={[
        "24/7 emergency response",
        "Electronic leak detection",
        "Licensed gas technicians",
        "Immediate repairs",
        "Safety inspections",
        "Code-compliant work",
        "Pressure testing",
        "Free safety consultation"
      ]}
      featuresTitle="Our Gas Leak Services"
      features={[
        {
          title: "Emergency Leak Detection",
          description: "Immediate response to suspected gas leaks with state-of-the-art electronic detection equipment. We quickly locate the exact source of leaks, even in hard-to-access areas like underground lines or behind walls."
        },
        {
          title: "Gas Leak Repair",
          description: "Expert repair of gas leaks using proper materials and techniques. All repairs meet or exceed safety codes and include pressure testing to verify leak-free operation before restoring service."
        },
        {
          title: "Gas Line Inspection",
          description: "Comprehensive safety inspections of gas lines and connections. We check for potential leaks, corrosion, improper fittings, and code violations. Detailed reports provided with recommended corrections."
        },
        {
          title: "Preventive Maintenance",
          description: "Regular inspection and maintenance of gas lines to prevent leaks before they occur. We check connections, test pressure, inspect appliance hookups, and identify aging components that may need replacement."
        }
      ]}
      faqs={[
        {
          question: "What should I do if I smell gas?",
          answer: "If you smell gas (rotten egg odor): 1) Don't use any electrical switches, phones, or create sparks, 2) Evacuate everyone immediately, 3) Call 911 from a safe location, 4) Call your gas company to shut off the meter, 5) Call us for emergency repair once the area is safe."
        },
        {
          question: "How do you detect gas leaks?",
          answer: "We use electronic gas detectors that can sense even tiny amounts of gas. These devices pinpoint leak locations quickly and accurately. We also use soap bubble tests, pressure testing, and visual inspection of connections and lines."
        },
        {
          question: "Can gas leaks be repaired or do lines need replacement?",
          answer: "Most gas leaks can be repaired by replacing damaged fittings, tightening connections, or patching small sections of pipe. Extensive corrosion or damage may require line replacement. We'll assess and recommend the safest, most cost-effective solution."
        },
        {
          question: "How much does gas leak repair cost?",
          answer: "Emergency gas leak detection and repair costs vary based on location and severity. Simple repairs may cost $200-500, while major repairs or line replacement can run higher. We provide upfront emergency service pricing."
        },
        {
          question: "Do you offer gas leak prevention services?",
          answer: "Yes, we provide annual gas line inspections to catch potential issues before they become leaks. Regular inspections include pressure testing, connection checks, and appliance hookup verification for complete peace of mind."
        },
        {
          question: "Are you available 24/7 for gas leak emergencies?",
          answer: "Yes, we provide 24/7 emergency response for gas leaks. Gas leaks are serious safety hazards requiring immediate professional attention. Call us anytime, day or night, and we'll respond quickly to protect your home and family."
        }
      ]}
      relatedServices={[
        { title: "Gas Line Services", path: "/gas-line-services" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Leak Repair Services", path: "/leak-repair" },
        { title: "Water Heater Services", path: "/water-heater-services" }
      ]}
      reviewsCategory="gas"
      reviewsTitle="Gas Leak Detection Customer Reviews"
      blogCategory="Gas Services"
    />
  );
}
