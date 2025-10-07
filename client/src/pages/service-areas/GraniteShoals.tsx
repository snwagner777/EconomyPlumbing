import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function GraniteShoalsServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/marble-falls" },
    { name: "Horseshoe Bay", path: "/horseshoe-bay" },
    { name: "Kingsland", path: "/kingsland" },
    { name: "Burnet", path: "/burnet" },
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
