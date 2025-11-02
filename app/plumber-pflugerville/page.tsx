'use client';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function PflugervilleServiceArea() {
  const nearbyCities = [
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
  ];

  return (
    <ServiceAreaPage
      city="Pflugerville"
      state="TX"
      slug="pflugerville"
      metaDescription="Pflugerville plumber for Falcon Pointe, Blackhawk, Springbrook. Expert water heater repair, drain cleaning, gas lines. Licensed plumbers."
      canonical="https://www.plumbersthatcare.com/plumber-pflugerville"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage="/attached_assets/optimized/plumber_working_on_p_e4a794f0.webp"
      heroSubtitle="Expert plumbing services for Pflugerville residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
      cityHighlight="Serving Pflugerville and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
