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
      metaDescription="Reliable plumbing services in Kyle, TX. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 368-9159."
      canonical="https://economyplumbingservices.com/plumber-in-kyle--tx"
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
