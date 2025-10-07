import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function BudaServiceArea() {
  const nearbyCities = [
    { name: "Kyle", path: "/service-areas/kyle" },
    { name: "Austin", path: "/service-areas/austin" },
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
  ];

  return (
    <ServiceAreaPage
      city="Buda"
      state="TX"
      metaDescription="Professional plumbing services in Buda, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service available. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
