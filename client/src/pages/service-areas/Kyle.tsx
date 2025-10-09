import ServiceAreaPage from "@/components/ServiceAreaPage";
import kyleHero from "@assets/optimized/plumber_fixing_sink__ddae57ac.webp";

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
      slug="kyle"
      metaDescription="Reliable plumbing services in Kyle, TX. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 368-9159."
      canonical="https://www.plumbersthatcare.com/plumber-in-kyle--tx"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={kyleHero}
      heroSubtitle="Expert plumbing services for Kyle residents. Quick response, quality repairs, and exceptional customer service every time."
      cityHighlight="Serving Kyle's rapidly expanding community with reliable plumbing services. We're equipped to handle both residential and commercial projects."
    />
  );
}
