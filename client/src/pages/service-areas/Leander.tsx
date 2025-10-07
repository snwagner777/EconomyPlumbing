import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function LeanderServiceArea() {
  const nearbyCities = [
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Austin", path: "/service-areas/austin" },
  ];

  return (
    <ServiceAreaPage
      city="Leander"
      state="TX"
      metaDescription="Reliable plumbing services in Leander, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service available. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
