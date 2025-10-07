import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function SpicewoodServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  return (
    <ServiceAreaPage
      city="Spicewood"
      state="TX"
      metaDescription="Expert plumbing services in Spicewood, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Same-day service. Call (830) 460-3565."
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
