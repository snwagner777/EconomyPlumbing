'use client';
import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function RoundRockServiceArea() {
  const nearbyCities = [
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Leander", path: "/plumber-leander" },
  ];

  return (
    <ServiceAreaPage
      city="Round Rock"
      state="TX"
      slug="round-rock"
      metaDescription="Round Rock plumber for Teravista, Forest Creek, Walsh Ranch. Expert water heater repair, drain cleaning, leak detection. Emergency plumbing."
      canonical="https://www.plumbersthatcare.com/round-rock-plumber"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage="/attached_assets/optimized/plumber_working_on_p_6dc2075d.webp"
      heroSubtitle="Expert plumbing services for Round Rock residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed."
      cityHighlight="Serving Round Rock and the Austin Metro area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
