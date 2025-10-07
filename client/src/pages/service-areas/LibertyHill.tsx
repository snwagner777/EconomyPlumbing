import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function LibertyHillServiceArea() {
  const nearbyCities = [
    { name: "Leander", path: "/plumber-leander" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
  ];

  return (
    <ServiceAreaPage
      city="Liberty Hill"
      state="TX"
      metaDescription="Quality plumbing services in Liberty Hill, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 368-9159 for service."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
