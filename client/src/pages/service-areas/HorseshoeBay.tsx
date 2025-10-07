import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function HorseshoeBayServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/marble-falls" },
    { name: "Kingsland", path: "/kingsland" },
    { name: "Granite Shoals", path: "/granite-shoals" },
    { name: "Burnet", path: "/burnet" },
    { name: "Spicewood", path: "/spicewood" },
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
