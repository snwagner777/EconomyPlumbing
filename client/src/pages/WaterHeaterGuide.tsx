import ServicePage from "@/components/ServicePage";
import heaterGuideImage from "@assets/generated_images/Tankless_water_heater_closeup_7279af49.png";

export default function WaterHeaterGuide() {
  return (
    <ServicePage
      title="Water Heater Buying Guide | Tank vs Tankless Comparison TX"
      metaDescription="Water heater buying guide for Austin & Marble Falls. Compare tank vs tankless, gas vs electric, sizing, efficiency, costs. Expert advice. (512) 368-9159."
      canonical="https://economyplumbingservices.com/water-heater-guide"
      heroImage={heaterGuideImage}
      heroImageAlt="Water heater buying guide and selection help in Central Texas"
      heroTitle="Water Heater Buying Guide"
      heroSubtitle="Choose the Perfect Water Heater for Your Home"
      overviewTitle="Complete Water Heater Guide"
      overviewDescription="Choosing the right water heater is a major decision that affects comfort, energy bills, and your home's value. Our comprehensive guide helps you understand your options and make an informed choice for your specific needs and budget."
      benefits={[
        "Expert guidance",
        "Tank vs tankless comparison",
        "Size recommendations",
        "Efficiency ratings explained",
        "Cost analysis",
        "Brand recommendations",
        "Free consultation",
        "Professional installation"
      ]}
      featuresTitle="Water Heater Options"
      features={[
        {
          title: "Tank Water Heaters",
          description: "Traditional storage tank heaters provide reliable hot water at lower upfront costs. Available in 30-80 gallon capacities. Gas models offer faster recovery; electric models are simpler to install. Typical lifespan 10-15 years."
        },
        {
          title: "Tankless Water Heaters",
          description: "On-demand tankless heaters provide endless hot water and save space. 20-30% more efficient than tanks. Higher upfront cost but lower operating costs. Ideal for smaller homes or as point-of-use units. Lifespan 20+ years."
        },
        {
          title: "Heat Pump Water Heaters",
          description: "Ultra-efficient hybrid heaters use heat pump technology to heat water. 2-3x more efficient than standard electric tanks. Higher upfront cost offset by utility rebates and energy savings. Best in warm climates like Texas."
        },
        {
          title: "Solar Water Heaters",
          description: "Solar thermal systems use sun energy to heat water, reducing energy costs by 50-80%. Best combined with backup gas or electric heater. High upfront cost but significant long-term savings and eco-friendly operation."
        }
      ]}
      faqs={[
        {
          question: "Tank or tankless: which is better?",
          answer: "It depends on your needs. Tanks cost less upfront and provide more hot water at once. Tankless saves energy, lasts longer, and provides endless hot water but costs more to install. We'll help you decide based on your usage, budget, and home."
        },
        {
          question: "What size water heater do I need?",
          answer: "For tanks: 30-40 gallons for 1-2 people, 40-50 for 2-3 people, 50-80 for 4+ people. For tankless: calculate peak demand in GPM (gallons per minute). We'll assess your needs and recommend the right size."
        },
        {
          question: "Gas or electric water heater?",
          answer: "Gas heaters heat water faster and cost less to operate but require proper venting. Electric heaters are easier to install but cost more to operate. Your choice depends on available utilities, installation location, and energy costs."
        },
        {
          question: "How much does a new water heater cost?",
          answer: "Tank water heaters: $1,200-2,500 installed. Tankless: $2,500-4,500 installed. Heat pump: $2,000-3,500. Costs vary by capacity, fuel type, and installation complexity. We provide detailed estimates."
        },
        {
          question: "What are the best water heater brands?",
          answer: "Top brands include Rheem, AO Smith, Bradford White, Navien (tankless), and Rinnai (tankless). We recommend proven brands with good warranty coverage and available parts. Specific recommendations depend on your needs and budget."
        },
        {
          question: "How long do water heaters last?",
          answer: "Tank water heaters last 10-15 years on average. Tankless units last 20+ years. Regular maintenance, water quality, and proper installation affect lifespan. We offer maintenance plans to maximize your heater's life."
        }
      ]}
      relatedServices={[
        { title: "Water Heater Services", path: "/water-heater-services" },
        { title: "Water Pressure Solutions", path: "/water-pressure-solutions" },
        { title: "Gas Line Services", path: "/gas-services" }
      ]}
    />
  );
}
