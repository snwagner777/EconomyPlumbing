import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function RoundRockServiceArea() {
  const nearbyCities = [
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Pflugerville", path: "/service-areas/pflugerville" },
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Austin", path: "/service-areas/austin" },
    { name: "Leander", path: "/service-areas/leander" },
  ];

  return (
    <ServiceAreaPage
      city="Round Rock"
      state="TX"
      metaDescription="Expert plumbing services in Round Rock, TX. Water heater services, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
