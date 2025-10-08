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
      metaDescription="Professional plumbing services in Buda, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service available. Call (512) 368-9159."
      canonical="https://plumbersthatcare.com/plumber-in-buda--tx"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={budaHero}
      heroSubtitle="Trusted plumbing experts serving Buda families and businesses. Fast response times, quality workmanship, and competitive rates."
      cityHighlight="Serving Buda's growing community with reliable plumbing services. From new construction to emergency repairs, we're your local plumbing partner."
    />
  );
}
