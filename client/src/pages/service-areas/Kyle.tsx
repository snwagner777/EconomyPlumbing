import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function KyleServiceArea() {
  const nearbyCities = [
    { name: "Buda", path: "/buda" },
    { name: "Austin", path: "/austin" },
    { name: "Pflugerville", path: "/pflugerville" },
    { name: "Round Rock", path: "/round-rock" },
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
