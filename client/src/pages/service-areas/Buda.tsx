import ServiceAreaPage from "@/components/ServiceAreaPage";
import budaHero from "@assets/optimized/plumber_fixing_sink__b2426749.webp";

export default function BudaServiceArea() {
  const nearbyCities = [
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
  ];

  return (
    <ServiceAreaPage
      city="Buda"
      state="TX"
      slug="buda"
      metaDescription="Buda, TX plumber near Austin. Expert water heater repair, drain cleaning & emergency plumbing services. Same-day service available. Call (512) 368-9159 now."
      canonical="https://www.plumbersthatcare.com/plumber-buda"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={budaHero}
      heroSubtitle="Trusted plumbing experts serving Buda families and businesses. Fast response times, quality workmanship, and competitive rates."
      cityHighlight="Serving Buda's growing community with reliable plumbing services. From new construction to emergency repairs, we're your local plumbing partner."
    />
  );
}
