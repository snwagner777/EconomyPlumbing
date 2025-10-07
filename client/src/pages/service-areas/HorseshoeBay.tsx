import ServiceAreaPage from "@/components/ServiceAreaPage";

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
    />
  );
}
