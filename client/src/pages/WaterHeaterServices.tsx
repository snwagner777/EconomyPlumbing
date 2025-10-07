import ServicePage from "@/components/ServicePage";
import waterHeaterImage from "@assets/generated_images/Tankless_water_heater_closeup_7279af49.png";

export default function WaterHeaterServices() {
  return (
    <ServicePage
      title="Water Heater Repair & Replacement | Austin & Marble Falls TX"
      metaDescription="Austin & Marble Falls water heater installation, repair, replacement. Tankless & traditional. Same-day service. All brands. Free estimates. (512) 368-9159."
      canonical="https://economyplumbingservices.com/water-heater-services"
      heroImage={waterHeaterImage}
      heroImageAlt="Professional water heater installation and repair service in Austin and Marble Falls TX"
      heroTitle="Water Heater Services"
      heroSubtitle="Expert Installation, Repair & Replacement in Austin & Marble Falls"
      overviewTitle="Professional Water Heater Solutions"
      overviewDescription="Whether you need a new water heater installation, emergency repair, or routine maintenance, Economy Plumbing Services has you covered. We service all major brands and specialize in both traditional tank and tankless water heaters."
      benefits={[
        "Same-day service available",
        "All major brands serviced",
        "Tankless water heater specialists",
        "Energy-efficient options",
        "Licensed & insured technicians",
        "Free estimates on new installations",
        "Warranty on all work",
        "Emergency repair services"
      ]}
      featuresTitle="Our Water Heater Services"
      features={[
        {
          title: "Water Heater Installation",
          description: "Professional installation of traditional tank and tankless water heaters. We help you choose the right size and type for your home's needs and budget."
        },
        {
          title: "Water Heater Repair",
          description: "Fast diagnosis and repair of all water heater issues including no hot water, leaks, strange noises, and pilot light problems. Same-day service available."
        },
        {
          title: "Tankless Water Heaters",
          description: "Specialist installation and service for tankless water heaters. Enjoy endless hot water and energy savings with our expert tankless solutions."
        },
        {
          title: "Maintenance & Inspection",
          description: "Regular maintenance extends your water heater's life and prevents costly breakdowns. We provide comprehensive inspection and maintenance services."
        }
      ]}
      faqs={[
        {
          question: "How long does a water heater typically last?",
          answer: "Traditional tank water heaters typically last 8-12 years, while tankless water heaters can last 15-20 years with proper maintenance. Regular maintenance can help extend the life of your unit."
        },
        {
          question: "Should I choose a tankless or traditional water heater?",
          answer: "Tankless water heaters provide endless hot water and are more energy-efficient, but have higher upfront costs. Traditional tanks are less expensive initially but have higher operating costs. We'll help you evaluate your needs, usage patterns, and budget to make the best choice."
        },
        {
          question: "What size water heater do I need?",
          answer: "Water heater size depends on your household size, peak usage times, and hot water needs. A family of 4 typically needs a 50-gallon tank or a tankless unit rated for 7-9 gallons per minute. We'll assess your specific needs during the estimate."
        },
        {
          question: "Do you offer same-day water heater installation?",
          answer: "Yes! If we have your desired water heater model in stock, we can often complete same-day installation. For emergency situations with no hot water, we prioritize quick response and installation."
        },
        {
          question: "What brands of water heaters do you service?",
          answer: "We service all major water heater brands including Rheem, Bradford White, AO Smith, Rinnai, Navien, Noritz, and more. Our technicians are trained on all types of water heaters."
        },
        {
          question: "How much does water heater installation cost?",
          answer: "Costs vary based on the type and size of water heater. Traditional tank installations typically range from $1,200-$2,500, while tankless installations range from $2,500-$4,500. We provide free, detailed estimates with no obligation."
        }
      ]}
      relatedServices={[
        { title: "Leak Repair Services", path: "/leak-repair" },
        { title: "Gas Services", path: "/gas-services" },
        { title: "Commercial Plumbing", path: "/commercial-plumbing" }
      ]}
    />
  );
}
