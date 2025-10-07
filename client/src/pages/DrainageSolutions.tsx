import ServicePage from "@/components/ServicePage";
import drainageImage from "@assets/generated_images/Drain_cleaning_professional_service_e8a953c5.png";

export default function DrainageSolutions() {
  return (
    <ServicePage
      title="Drainage Solutions | French Drains, Yard Drainage & Sump Pumps TX"
      metaDescription="Professional drainage solutions in Austin & Marble Falls. French drains, yard drainage systems, sump pump installation. Fix standing water, foundation issues. Free drainage consultation."
      heroImage={drainageImage}
      heroImageAlt="Professional drainage solutions and French drain installation in Central Texas"
      heroTitle="Drainage Solutions"
      heroSubtitle="French Drains, Yard Drainage & Foundation Protection"
      overviewTitle="Expert Drainage Solutions"
      overviewDescription="Standing water and poor drainage can damage your foundation, create mosquito breeding grounds, and ruin your landscaping. Our drainage experts design and install custom solutions to keep your property dry and protected."
      benefits={[
        "Custom drainage design",
        "French drain installation",
        "Yard grading solutions",
        "Sump pump systems",
        "Foundation protection",
        "Erosion control",
        "Free drainage assessment",
        "Landscape-friendly solutions"
      ]}
      featuresTitle="Our Drainage Services"
      features={[
        {
          title: "French Drain Systems",
          description: "Professional installation of French drains to redirect water away from foundations, basements, and problem areas. We use proper gravel, perforated pipe, and fabric to ensure long-lasting performance."
        },
        {
          title: "Yard Drainage Solutions",
          description: "Custom drainage systems for yards with standing water, including surface drains, channel drains, and grading solutions. We'll design a system that works with your landscape and solves your specific drainage issues."
        },
        {
          title: "Sump Pump Installation",
          description: "Complete sump pump systems including basin installation, pump setup, and discharge line routing. Battery backup options available for continued protection during power outages."
        },
        {
          title: "Foundation Drainage",
          description: "Protect your foundation with proper drainage systems that channel water away from your home. We install perimeter drains, downspout extensions, and grading improvements to prevent foundation damage."
        }
      ]}
      faqs={[
        {
          question: "How do I know if I need a drainage solution?",
          answer: "Signs include standing water after rain, soggy areas in your yard, water in your basement or crawl space, foundation cracks, or erosion around your property. We offer free drainage assessments to evaluate your situation."
        },
        {
          question: "What is a French drain?",
          answer: "A French drain is a gravel-filled trench containing a perforated pipe that redirects water away from problem areas. It's one of the most effective drainage solutions for yards, foundations, and basements."
        },
        {
          question: "How much does a French drain cost?",
          answer: "Costs vary based on length, depth, and site conditions. Simple French drains may start around $1,500-2,500 for 50-100 feet, while complex systems can run higher. We provide free estimates with detailed pricing."
        },
        {
          question: "Can you fix drainage without tearing up my landscaping?",
          answer: "We always work to minimize landscape disruption and can often route drains along property lines, under walkways, or in existing mulch beds. We'll restore any disturbed areas and can coordinate with landscapers if needed."
        },
        {
          question: "How long do drainage systems last?",
          answer: "Properly installed drainage systems can last 20-30+ years. We use quality materials including schedule 40 PVC, heavy-duty fabric, and clean drainage rock to ensure long-term performance."
        },
        {
          question: "Do you offer drainage system maintenance?",
          answer: "Yes, we provide drainage system inspections and cleaning to keep your system flowing properly. This includes clearing debris, checking outlets, and ensuring proper function of all components."
        }
      ]}
      relatedServices={[
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Sump Pump Services", path: "/sewage-pump-services" },
        { title: "Water Leak Repair", path: "/water-leak-repair" }
      ]}
    />
  );
}
