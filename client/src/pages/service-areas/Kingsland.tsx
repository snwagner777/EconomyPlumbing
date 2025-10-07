import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function KingslandServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/service-areas/marble-falls" },
    { name: "Horseshoe Bay", path: "/service-areas/horseshoe-bay" },
    { name: "Granite Shoals", path: "/service-areas/granite-shoals" },
    { name: "Burnet", path: "/service-areas/burnet" },
  ];

  return (
    <ServiceAreaPage
      city="Kingsland"
      state="TX"
      metaDescription="Trusted plumbing services in Kingsland, TX. Water heater repair, drain cleaning, leak detection, and commercial plumbing. Licensed plumbers. Call (830) 460-3565."
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
