import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function MarbleFallsServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/burnet" },
    { name: "Horseshoe Bay", path: "/horseshoe-bay" },
    { name: "Kingsland", path: "/kingsland" },
    { name: "Granite Shoals", path: "/granite-shoals" },
    { name: "Spicewood", path: "/spicewood" },
    { name: "Bertram", path: "/bertram" },
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
