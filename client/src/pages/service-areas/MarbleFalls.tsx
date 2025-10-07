import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function MarbleFallsServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Spicewood", path: "/plumber-spicewood" },
    { name: "Bertram", path: "/plumber-bertram" },
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
