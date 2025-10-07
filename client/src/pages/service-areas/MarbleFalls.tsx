import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function MarbleFallsServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/service-areas/burnet" },
    { name: "Horseshoe Bay", path: "/service-areas/horseshoe-bay" },
    { name: "Kingsland", path: "/service-areas/kingsland" },
    { name: "Granite Shoals", path: "/service-areas/granite-shoals" },
    { name: "Spicewood", path: "/service-areas/spicewood" },
    { name: "Bertram", path: "/service-areas/bertram" },
  ];

  return (
    <ServiceAreaPage
      city="Marble Falls"
      state="TX"
      metaDescription="Expert plumbing services in Marble Falls, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Licensed plumbers. Call (830) 460-3565."
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
