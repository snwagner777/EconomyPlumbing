import ServiceAreaPage from "@/components/ServiceAreaPage";
import heroImage from "@assets/optimized/professional_plumber_f5e4b5a9.webp";

export default function LeanderServiceArea() {
  const nearbyCities = [
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Austin", path: "/plumber-austin" },
  ];

  return (
    <ServiceAreaPage
      city="Leander"
      state="TX"
      slug="leander"
      metaDescription="Leander plumber serving Crystal Falls, Travisso, Mason Hills. Expert water heater repair, drain cleaning, leak detection. Same-day service."
      canonical="https://www.plumbersthatcare.com/plumber-leander"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={heroImage}
      heroSubtitle="Expert plumbing services for Leander residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
      cityHighlight="Serving Leander and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
