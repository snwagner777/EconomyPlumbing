import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function LibertyHillServiceArea() {
  const nearbyCities = [
    { name: "Leander", path: "/service-areas/leander" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
  ];

  return (
    <ServiceAreaPage
      city="Liberty Hill"
      state="TX"
      metaDescription="Quality plumbing services in Liberty Hill, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 649-2811 for service."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
