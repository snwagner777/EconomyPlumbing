import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function HorseshoeBayServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/service-areas/marble-falls" },
    { name: "Kingsland", path: "/service-areas/kingsland" },
    { name: "Granite Shoals", path: "/service-areas/granite-shoals" },
    { name: "Burnet", path: "/service-areas/burnet" },
    { name: "Spicewood", path: "/service-areas/spicewood" },
  ];

  return (
    <ServiceAreaPage
      city="Horseshoe Bay"
      state="TX"
      metaDescription="Quality plumbing services in Horseshoe Bay, TX. Water heater services, drain cleaning, leak repair, and emergency plumbing. Call (830) 460-3565 for service."
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
