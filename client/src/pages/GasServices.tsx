import ServicePage from "@/components/ServicePage";
import gasImage from "@assets/generated_images/Commercial_plumbing_services_bd7b6306.png";

export default function GasServices() {
  return (
    <ServicePage
      title="Gas Line Installation & Repair | Licensed Gas Plumbers TX"
      metaDescription="Licensed gas line installation, repair, and safety inspections in Austin & Marble Falls. Gas appliance hookups, leak detection, emergency service. Certified gas technicians."
      heroImage={gasImage}
      heroImageAlt="Licensed gas line installation and repair service in Austin and Marble Falls TX"
      heroTitle="Gas Line Services"
      heroSubtitle="Licensed Gas Line Installation, Repair & Safety Inspections"
      overviewTitle="Professional Gas Line Services"
      overviewDescription="Safety is our top priority when working with gas lines. Our licensed and certified gas technicians provide expert installation, repair, and inspection services for all your gas line needs, from new appliance hookups to emergency leak repairs."
      benefits={[
        "Licensed gas technicians",
        "Safety inspections",
        "Gas line installation",
        "Gas leak detection & repair",
        "Appliance hookups",
        "Emergency gas service",
        "Code compliant work",
        "Pressure testing"
      ]}
      featuresTitle="Our Gas Line Services"
      features={[
        {
          title: "Gas Line Installation",
          description: "Professional installation of new gas lines for appliances, outdoor kitchens, fire pits, pool heaters, and generators. All work meets or exceeds local codes and safety standards."
        },
        {
          title: "Gas Leak Repair",
          description: "Immediate response to gas leaks with electronic leak detection and expert repairs. We locate and fix leaks quickly and safely, ensuring your home's safety is never compromised."
        },
        {
          title: "Appliance Hookups",
          description: "Safe installation and hookup of gas appliances including ranges, dryers, water heaters, furnaces, and fireplaces. Proper installation ensures efficient operation and safety."
        },
        {
          title: "Safety Inspections",
          description: "Comprehensive gas line safety inspections including pressure testing and leak detection. We identify potential hazards before they become emergencies and provide detailed reports."
        }
      ]}
      faqs={[
        {
          question: "How do I know if I have a gas leak?",
          answer: "Signs of a gas leak include the smell of rotten eggs (added to natural gas for detection), hissing sounds near gas lines, dead plants near gas lines, and physical symptoms like dizziness or nausea. If you suspect a leak, evacuate immediately and call 911, then contact us for emergency repair."
        },
        {
          question: "Can I install a gas line myself?",
          answer: "No. Gas line work must be performed by licensed professionals for safety and code compliance. Improper installation can lead to leaks, fires, explosions, and carbon monoxide poisoning. Our certified technicians ensure safe, code-compliant installations."
        },
        {
          question: "How much does gas line installation cost?",
          answer: "Costs vary based on distance, complexity, and local codes. Simple appliance hookups may start around $200-300, while extensive new gas line installations can range from $500-2,000+. We provide free, detailed estimates with no obligation."
        },
        {
          question: "Do you work with propane and natural gas?",
          answer: "Yes, we service both natural gas and propane (LP) systems. Our technicians are trained on both fuel types and understand the specific requirements and safety considerations for each."
        },
        {
          question: "Can you convert appliances from propane to natural gas?",
          answer: "Yes, we can convert most appliances from propane to natural gas or vice versa. This involves installing conversion kits and adjusting regulators. We'll assess your specific appliances and provide guidance on conversion feasibility and costs."
        },
        {
          question: "How often should gas lines be inspected?",
          answer: "We recommend annual gas line inspections, especially for older homes or if you're buying a new home. Regular inspections identify potential issues before they become dangerous and ensure your system operates safely and efficiently."
        }
      ]}
      relatedServices={[
        { title: "Water Heater Services", path: "/water-heater-services" },
        { title: "Emergency Services", path: "/emergency" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Leak Repair", path: "/leak-repair" }
      ]}
    />
  );
}
