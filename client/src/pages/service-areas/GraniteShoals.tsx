import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function GraniteShoalsServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  return (
    <ServiceAreaPage
      city="Granite Shoals"
      state="TX"
      metaDescription="Reliable plumbing services in Granite Shoals, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service. Call (830) 460-3565."
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
