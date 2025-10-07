import ServicePage from "@/components/ServicePage";
import disposalImage from "@assets/stock_images/kitchen_garbage_disp_6fe0b331.jpg";

export default function GarbageDisposalRepair() {
  return (
    <ServicePage
      title="Garbage Disposal Repair & Installation | Fix Jammed Disposal TX"
      metaDescription="Austin & Marble Falls garbage disposal repair & installation. Fix jammed, leaking, broken disposals. New installations. Same-day service. (512) 368-9159."
      canonical="https://economyplumbingservices.com/garbage-disposal-repair"
      heroImage={disposalImage}
      heroImageAlt="Professional garbage disposal repair and installation service in Central Texas"
      heroTitle="Garbage Disposal Services"
      heroSubtitle="Repair, Installation & Replacement of All Disposal Brands"
      overviewTitle="Expert Garbage Disposal Services"
      overviewDescription="Is your garbage disposal jammed, leaking, or making unusual noises? Our experienced plumbers can quickly diagnose and repair most disposal issues or provide expert installation of new units when replacement is needed."
      benefits={[
        "Same-day repairs",
        "All brands serviced",
        "Jam clearing",
        "Leak repair",
        "New installations",
        "Proper disposal sizing",
        "Quality replacements",
        "Professional cleanup"
      ]}
      featuresTitle="Our Disposal Services"
      features={[
        {
          title: "Disposal Repair",
          description: "Expert repair of jammed, leaking, or malfunctioning garbage disposals. We clear jams safely, fix leaks at mounting flanges and discharge connections, and repair electrical issues and reset buttons."
        },
        {
          title: "New Disposal Installation",
          description: "Professional installation of new garbage disposals including proper electrical connections, mounting, and plumbing. We'll help you select the right horsepower and features for your household needs."
        },
        {
          title: "Disposal Replacement",
          description: "Complete removal of old disposals and installation of new units. We properly dispose of old units and ensure your new disposal is correctly sized, mounted, and tested for leak-free operation."
        },
        {
          title: "Emergency Unjamming",
          description: "Fast response for jammed disposals causing backups. We safely clear jams without damage to the unit, remove foreign objects, and test to ensure proper operation before leaving."
        }
      ]}
      faqs={[
        {
          question: "Why is my garbage disposal jammed?",
          answer: "Common causes include bones, fruit pits, fibrous vegetables, grease buildup, or foreign objects like utensils. Never put your hand in the disposal. Turn off power and call us for safe unjamming."
        },
        {
          question: "How long do garbage disposals last?",
          answer: "Quality garbage disposals typically last 10-15 years with proper use and maintenance. Signs it's time to replace include frequent jams, persistent leaks, loud grinding noises, or the reset button trips frequently."
        },
        {
          question: "What size garbage disposal do I need?",
          answer: "For most households, a 3/4 HP disposal is sufficient. Larger families or homes with heavy use may benefit from 1 HP models. We'll assess your needs and recommend the appropriate size and features."
        },
        {
          question: "Can you fix a leaking garbage disposal?",
          answer: "Yes, we repair disposal leaks at the mounting flange, discharge tube, or dishwasher connection. Sometimes leaks indicate the unit is worn out and replacement is more cost-effective than repair."
        },
        {
          question: "How much does garbage disposal installation cost?",
          answer: "Basic disposal installation typically costs $200-400 including labor and a quality 3/4 HP disposal. Costs vary based on disposal model, any needed electrical work, and existing plumbing configuration."
        },
        {
          question: "Do I need a new outlet for a garbage disposal?",
          answer: "Most disposals require a dedicated 120V outlet under the sink. If you don't have one, we can install it as part of the disposal installation. This may add to the cost but ensures safe, code-compliant operation."
        }
      ]}
      relatedServices={[
        { title: "Drain Cleaning", path: "/drain-cleaning" },
        { title: "Faucet Installation", path: "/faucet-installation" },
        { title: "Leak Repair", path: "/leak-repair" },
        { title: "Toilet & Faucet Services", path: "/toilet-faucet" }
      ]}
    />
  );
}
