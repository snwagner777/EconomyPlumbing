import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function KyleServiceArea() {
  const nearbyCities = [
    { name: "Buda", path: "/service-areas/buda" },
    { name: "Austin", path: "/service-areas/austin" },
    { name: "Pflugerville", path: "/service-areas/pflugerville" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
  ];

  return (
    <ServiceAreaPage
      city="Kyle"
      state="TX"
      metaDescription="Reliable plumbing services in Kyle, TX. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
