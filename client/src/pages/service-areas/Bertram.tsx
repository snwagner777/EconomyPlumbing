import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function BertramServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/burnet" },
    { name: "Marble Falls", path: "/marble-falls" },
    { name: "Georgetown", path: "/georgetown" },
    { name: "Liberty Hill", path: "/liberty-hill" },
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
