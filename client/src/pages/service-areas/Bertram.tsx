import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function BertramServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/service-areas/burnet" },
    { name: "Marble Falls", path: "/service-areas/marble-falls" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
  ];

  return (
    <ServiceAreaPage
      city="Bertram"
      state="TX"
      metaDescription="Professional plumbing services in Bertram, TX. Water heater installation, drain cleaning, leak repair, and gas services. Licensed & insured. Call (830) 460-3565."
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
