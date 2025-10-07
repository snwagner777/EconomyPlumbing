import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function AustinServiceArea() {
  const nearbyCities = [
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Pflugerville", path: "/service-areas/pflugerville" },
    { name: "Buda", path: "/service-areas/buda" },
    { name: "Kyle", path: "/service-areas/kyle" },
    { name: "Leander", path: "/service-areas/leander" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
  ];

  return (
    <ServiceAreaPage
      city="Austin"
      state="TX"
      metaDescription="Expert plumbing services in Austin, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Licensed plumbers. Call (512) 649-2811 for same-day service."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
