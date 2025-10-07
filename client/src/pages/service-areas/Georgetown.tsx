import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function GeorgetownServiceArea() {
  const nearbyCities = [
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Leander", path: "/service-areas/leander" },
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
    { name: "Pflugerville", path: "/service-areas/pflugerville" },
  ];

  return (
    <ServiceAreaPage
      city="Georgetown"
      state="TX"
      metaDescription="Professional plumbing services in Georgetown, TX. Water heater installation, drain cleaning, leak detection & repair. Free estimates. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
