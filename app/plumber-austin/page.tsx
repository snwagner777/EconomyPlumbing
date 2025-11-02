'use client';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function AustinServiceArea() {
  const nearbyCities = [
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Buda", path: "/plumber-buda" },
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
  ];

  return (
    <ServiceAreaPage
      city="Austin"
      state="TX"
      slug="austin"
      metaDescription="Austin plumber serving Downtown, South Congress, East Austin. Expert water heater repair, drain cleaning, leak detection. Same-day service."
      canonical="https://www.plumbersthatcare.com/plumber-austin"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage="/attached_assets/optimized/professional_plumber_49e7ef9b.webp"
      heroSubtitle="Expert plumbing services for Austin residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
      cityHighlight="Serving Austin Metro and surrounding areas with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
