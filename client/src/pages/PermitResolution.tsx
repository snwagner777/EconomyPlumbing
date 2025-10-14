import ServicePage from "@/components/ServicePage";
import CommercialCustomersShowcase from "@/components/CommercialCustomersShowcase";
import permitImage from "@assets/optimized/Plumber_installing_water_heater_3f7d8a09.webp";

export default function PermitResolution() {
  return (
    <ServicePage
      title="Plumbing Permit Resolution Austin TX | Code Experts"
      metaDescription="Resolve plumbing permit issues and code violations in Austin. Fix unpermitted work for home sales, work with city inspectors. Call (512) 368-9159 now."
      canonical="https://www.plumbersthatcare.com/permit-resolution-services"
      heroImage={permitImage}
      heroImageAlt="Professional plumbing permit resolution and code compliance service in Central Texas"
      heroTitle="Permit Resolution Services"
      heroSubtitle="Fix Unpermitted Work & Code Violations"
      overviewTitle="Expert Permit Resolution"
      overviewDescription="Dealing with unpermitted plumbing work, code violations, or failed inspections? Our experienced team specializes in resolving permit issues, working with city inspectors, and bringing non-compliant plumbing up to code."
      customSection={<CommercialCustomersShowcase />}
      benefits={[
        "Work with inspectors",
        "Code compliance expertise",
        "Fix unpermitted work",
        "Resolve violations",
        "Permit applications",
        "Re-inspection support",
        "Real estate closing help",
        "Peace of mind"
      ]}
      featuresTitle="Our Permit Services"
      features={[
        {
          title: "Unpermitted Work Resolution",
          description: "Fix plumbing work done without permits during home sales or refinancing. We assess the work, obtain necessary permits, make corrections, and coordinate with inspectors to get everything approved."
        },
        {
          title: "Code Violation Corrections",
          description: "Correct code violations identified by inspectors or during home inspections. We understand local codes and know exactly what's required to bring your plumbing into compliance."
        },
        {
          title: "Failed Inspection Support",
          description: "Fix issues that caused inspection failures and coordinate re-inspections. We'll explain what went wrong, make necessary corrections, and work with inspectors to get approval."
        },
        {
          title: "Permit Applications",
          description: "Handle all permit applications and paperwork for plumbing projects. We know local requirements, submit complete applications, and manage the process from start to approval."
        }
      ]}
      faqs={[
        {
          question: "What happens if I have unpermitted plumbing work?",
          answer: "Unpermitted work can prevent home sales, cause insurance issues, or result in fines. We can help by obtaining after-the-fact permits, correcting any code violations, and getting the work approved through inspection."
        },
        {
          question: "How do I know if I need a plumbing permit?",
          answer: "Most plumbing work beyond simple repairs requires permits, including water heater installation, gas line work, sewer repairs, and new plumbing installations. When in doubt, call us or check with your local building department."
        },
        {
          question: "Can you help with real estate closing permit issues?",
          answer: "Yes, we frequently help buyers and sellers resolve permit issues discovered during home inspections. We work quickly to fix issues and get approvals to prevent delays in closing."
        },
        {
          question: "How much does permit resolution cost?",
          answer: "Costs vary based on the scope of work needed. Simple corrections might cost a few hundred dollars, while extensive work to bring major systems up to code can be more. We provide detailed estimates before starting."
        },
        {
          question: "How long does permit resolution take?",
          answer: "Simple issues may be resolved in days, while complex situations can take 2-4 weeks. Timeline depends on the work required, permit approval times, and inspector availability. We work to resolve issues as quickly as possible."
        },
        {
          question: "Will I face penalties for unpermitted work?",
          answer: "Penalties vary by jurisdiction. Most cities allow after-the-fact permits with additional fees. We'll help you navigate the process, minimize penalties, and ensure everything is properly documented and approved."
        }
      ]}
      relatedServices={[
        { title: "Commercial Plumbing", path: "/commercial-plumbing" },
        { title: "Water Heater Services", path: "/water-heater-services" },
        { title: "Gas Line Services", path: "/gas-services" },
        { title: "Backflow Testing", path: "/backflow-testing" }
      ]}
    />
  );
}
