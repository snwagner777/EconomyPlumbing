import ServicePage from "@/components/ServicePage";
import pressureImage from "@assets/generated_images/Tankless_water_heater_closeup_7279af49.png";

export default function WaterPressureSolutions() {
  return (
    <ServicePage
      title="Water Pressure Solutions | Fix Low & High Water Pressure TX"
      metaDescription="Expert water pressure solutions in Austin & Marble Falls. Fix low water pressure, reduce high pressure, install pressure regulators. Diagnose pressure problems. Same-day service."
      heroImage={pressureImage}
      heroImageAlt="Professional water pressure solutions and regulation services in Central Texas"
      heroTitle="Water Pressure Solutions"
      heroSubtitle="Fix Low Pressure, Reduce High Pressure & Regulate Flow"
      overviewTitle="Expert Water Pressure Services"
      overviewDescription="Water pressure problems affect every fixture in your home. Whether you're dealing with weak flow or pressure that's too high, our experienced plumbers can diagnose the issue and provide lasting solutions."
      benefits={[
        "Pressure diagnosis",
        "Low pressure fixes",
        "High pressure solutions",
        "Pressure regulator installation",
        "Booster pump systems",
        "Whole-home solutions",
        "Protect plumbing fixtures",
        "Improve water flow"
      ]}
      featuresTitle="Our Pressure Services"
      features={[
        {
          title: "Low Pressure Diagnosis & Repair",
          description: "Comprehensive diagnosis of low water pressure issues including clogged pipes, failing pressure regulators, undersized piping, or water supply problems. We identify the root cause and provide effective solutions."
        },
        {
          title: "Pressure Regulator Installation",
          description: "Install pressure reducing valves (PRVs) to protect your plumbing from high municipal water pressure. Regulators extend fixture life, reduce leaks, and prevent pipe damage from excessive pressure."
        },
        {
          title: "Booster Pump Systems",
          description: "Install booster pumps to increase water pressure in homes with chronically low pressure. Ideal for homes on wells, at high elevations, or at the end of water mains where pressure is insufficient."
        },
        {
          title: "High Pressure Solutions",
          description: "Reduce dangerously high water pressure that causes leaks, appliance damage, and wasted water. We install or replace pressure regulators and adjust settings for optimal pressure throughout your home."
        }
      ]}
      faqs={[
        {
          question: "What is normal water pressure for a home?",
          answer: "Normal residential water pressure is 40-70 PSI. Pressure below 40 PSI feels weak and may indicate problems. Pressure above 80 PSI can damage fixtures and pipes and should be reduced with a pressure regulator."
        },
        {
          question: "Why is my water pressure suddenly low?",
          answer: "Sudden low pressure can indicate a leak, a closed shutoff valve, a failed pressure regulator, mineral buildup in pipes, or municipal water supply issues. We can diagnose the cause and provide solutions."
        },
        {
          question: "Will a pressure regulator lower my water bill?",
          answer: "Yes, reducing excessive water pressure typically lowers water bills by 20-30%. High pressure causes faster water flow and more water use. A regulator also extends fixture life and prevents costly leaks."
        },
        {
          question: "How much does pressure regulator installation cost?",
          answer: "Pressure regulator installation typically costs $300-600 including the valve and labor. Costs vary based on valve quality, installation location, and whether any pipe modifications are needed."
        },
        {
          question: "Can you fix low pressure in just one area?",
          answer: "Yes, isolated low pressure is often caused by clogged pipes, a bad fixture, or a closed shutoff valve in that area. We'll trace the supply line, identify restrictions, and restore proper pressure."
        },
        {
          question: "How do I know if my water pressure is too high?",
          answer: "Signs include banging pipes (water hammer), leaking faucets and toilets, short appliance life, and your pressure exceeds 80 PSI. We can test your pressure and install a regulator if needed."
        }
      ]}
      relatedServices={[
        { title: "Water Leak Repair", path: "/water-leak-repair" },
        { title: "Faucet Installation", path: "/faucet-installation" },
        { title: "Water Heater Services", path: "/water-heater-services" }
      ]}
    />
  );
}
