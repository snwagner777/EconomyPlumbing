import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function KyleServiceArea() {
  const nearbyCities = [
    { name: "Buda", path: "/plumber-buda" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Round Rock", path: "/round-rock-plumber" },
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
