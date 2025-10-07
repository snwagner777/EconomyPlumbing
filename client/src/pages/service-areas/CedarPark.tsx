import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function CedarParkServiceArea() {
  const nearbyCities = [
    { name: "Austin", path: "/service-areas/austin" },
    { name: "Leander", path: "/service-areas/leander" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
    { name: "Pflugerville", path: "/service-areas/pflugerville" },
  ];

  return (
    <ServiceAreaPage
      city="Cedar Park"
      state="TX"
      metaDescription="Professional plumbing services in Cedar Park, TX. Water heater installation, drain cleaning, leak repair, and more. Licensed & insured. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
