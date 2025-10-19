import ServiceAreaPage from "@/components/ServiceAreaPage";
import heroImage from "@assets/optimized/plumbing_maintenance_91eba3a0.webp";

export default function GeorgetownServiceArea() {
  const nearbyCities = [
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
  ];

  return (
    <ServiceAreaPage
      city="Georgetown"
      state="TX"
      slug="georgetown"
      metaDescription="Georgetown plumber for Sun City, Wolf Ranch, Berry Creek. Expert water heater repair, drain cleaning, emergency plumbing. Licensed plumbers."
      canonical="https://www.plumbersthatcare.com/plumber-georgetown"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={heroImage}
      heroSubtitle="Expert plumbing services for Georgetown residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
      cityHighlight="Serving Georgetown and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
