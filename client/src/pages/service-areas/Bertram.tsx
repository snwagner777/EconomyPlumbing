import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function BertramServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
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
