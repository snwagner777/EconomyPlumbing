import ServiceAreaPage from "@/components/ServiceAreaPage";
import horseshoeBayHero from "@assets/stock_images/plumber_working_bath_98208ff5.jpg";

export default function HorseshoeBayServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Spicewood", path: "/plumber-spicewood" },
  ];

  return (
    <ServiceAreaPage
      city="Horseshoe Bay"
      state="TX"
      metaDescription="Quality plumbing services in Horseshoe Bay, TX. Water heater services, drain cleaning, leak repair, and emergency plumbing. Call (830) 460-3565 for service."
      canonical="https://economyplumbingservices.com/plumber-in-horseshoe-bay--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={horseshoeBayHero}
      heroSubtitle="Horseshoe Bay's plumbing experts. Specialized service for lakefront properties, residential homes, and vacation rentals."
      cityHighlight="Serving Horseshoe Bay's unique plumbing needs. We understand lakefront properties and provide specialized solutions for this waterfront community."
    />
  );
}
