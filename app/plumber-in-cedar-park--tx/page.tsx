'use client';
import ServiceAreaPage from "@/components/ServiceAreaPage";
import heroImage from "@assets/optimized/professional_plumber_d3924ca6.webp";

export default function CedarParkServiceArea() {
  const nearbyCities = [
    { name: "Austin", path: "/plumber-austin" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
  ];

  return (
    <ServiceAreaPage
      city="Cedar Park"
      state="TX"
      slug="cedar-park"
      metaDescription="Cedar Park plumber for Lakeline, Buttercup Creek, Whitestone. Expert water heater installation, drain cleaning, gas lines. Same-day service."
      canonical="https://www.plumbersthatcare.com/plumber-in-cedar-park--tx"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={heroImage}
      heroSubtitle="Expert plumbing services for Cedar Park residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
      cityHighlight="Serving Cedar Park and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
