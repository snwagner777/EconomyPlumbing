import ServicePage from "@/components/ServicePage";
import leakImage from "@assets/optimized/Leak_repair_service_work_cb3145cc.webp";

export default function LeakRepair() {
  return (
    <ServicePage
      title="Leak Detection & Repair | Austin & Marble Falls Plumber"
      metaDescription="Fast leak detection & repair in Austin & Marble Falls. Slab leaks, pipe leaks, faucet leaks. Insurance help. Emergency 24/7 service. Call (512) 368-9159."
      canonical="https://plumbersthatcare.com/leak-repair"
      heroImage={leakImage}
      heroImageAlt="Professional leak detection and repair service in Austin and Marble Falls TX"
      heroTitle="Leak Repair Services"
      heroSubtitle="Fast, Professional Leak Detection & Repair in Central Texas"
      overviewTitle="Expert Leak Detection & Repair"
      overviewDescription="Don't let a small leak become a major problem. Our experienced technicians use advanced leak detection equipment to quickly locate and repair all types of leaks, from visible faucet drips to hidden slab leaks."
      benefits={[
        "Fast leak detection",
        "Advanced leak detection technology",
        "Slab leak specialists",
        "Pipe leak repair",
        "Faucet & fixture leaks",
        "Insurance claim assistance",
        "Permanent solutions",
        "Emergency leak repair"
      ]}
      featuresTitle="Our Leak Repair Services"
      features={[
        {
          title: "Leak Detection",
          description: "State-of-the-art electronic leak detection equipment locates hidden leaks in walls, under slabs, and underground without destructive exploration. We find leaks quickly and accurately."
        },
        {
          title: "Slab Leak Repair",
          description: "Specialized repair of leaks in pipes beneath concrete slabs. We use the least invasive methods possible and can reroute pipes when necessary to provide permanent solutions."
        },
        {
          title: "Pipe Leak Repair",
          description: "Expert repair or replacement of leaking pipes including copper, PEX, CPVC, and galvanized pipes. We recommend the best repair method based on pipe age, condition, and location."
        },
        {
          title: "Insurance Claims Assistance",
          description: "We provide detailed documentation and work directly with insurance companies to help you file claims for leak damage. Our reports include photos, findings, and repair recommendations."
        }
      ]}
      faqs={[
        {
          question: "How do I know if I have a hidden leak?",
          answer: "Signs include unexplained increases in water bills, sound of running water when nothing is on, damp spots on floors or walls, musty odors, foundation cracks, or warm spots on floors (hot water leaks). We offer professional leak detection services to confirm and locate hidden leaks."
        },
        {
          question: "What is a slab leak and why is it serious?",
          answer: "A slab leak is a leak in water lines running beneath your home's concrete foundation. They're serious because they can cause foundation damage, high water bills, and mold growth. Early detection and repair are crucial to minimize damage and costs."
        },
        {
          question: "How do you find hidden leaks without tearing up my home?",
          answer: "We use electronic leak detection equipment including acoustic listening devices, infrared cameras, and pressure testing. These non-invasive methods pinpoint leak locations without unnecessary demolition."
        },
        {
          question: "Will my insurance cover leak repairs?",
          answer: "Many homeowner policies cover sudden and accidental leaks and resulting damage. Coverage varies by policy and situation. We provide detailed documentation to support your claim and can work directly with your insurance adjuster."
        },
        {
          question: "How quickly can you respond to a leak emergency?",
          answer: "We offer same-day service for leak emergencies. For severe leaks causing active damage, we can often respond within hours. We'll also guide you on immediate steps to minimize damage while we're en route."
        },
        {
          question: "Should I repair or replace leaking pipes?",
          answer: "It depends on the pipe's age, material, and overall condition. A single leak in old or corroded pipes may indicate more failures soon. We'll assess the situation and provide honest recommendations for both short-term fixes and long-term solutions."
        }
      ]}
      relatedServices={[
        { title: "Water Heater Services", path: "/water-heater-services" },
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Toilet & Faucet Services", path: "/toilet-faucet" },
        { title: "Water Pressure Solutions", path: "/water-pressure-solutions" }
      ]}
      reviewsCategory="leak"
      reviewsTitle="Leak Repair Customer Reviews"
      blogCategory="Emergency Tips"
    />
  );
}
