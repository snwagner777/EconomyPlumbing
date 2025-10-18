import ServiceAreaPage from "@/components/ServiceAreaPage";
import burnetHero from "@assets/optimized/plumber_working_bath_2fe77426.webp";

export default function BurnetServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Bertram", path: "/plumber-bertram" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
  ];

  return (
    <ServiceAreaPage
      city="Burnet"
      state="TX"
      slug="burnet"
      metaDescription="Professional plumbing services in Burnet, TX. Water heater installation, drain cleaning, leak repair, and more. Licensed & insured. Call (830) 460-3565."
      canonical="https://www.plumbersthatcare.com/plumber-burnet"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={burnetHero}
      heroSubtitle="Burnet's preferred plumbing service provider. Fast, reliable solutions for all your residential and commercial plumbing needs."
      cityHighlight="Serving Burnet County with pride. From routine maintenance to complex installations, we handle all your plumbing requirements."
    />
  );
}
