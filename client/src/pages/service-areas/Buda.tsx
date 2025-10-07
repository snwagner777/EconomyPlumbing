import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function BudaServiceArea() {
  const nearbyCities = [
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
  ];

  return (
    <ServiceAreaPage
      city="Buda"
      state="TX"
      metaDescription="Professional plumbing services in Buda, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service available. Call (512) 368-9159."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
