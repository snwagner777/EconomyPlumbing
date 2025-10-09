import ServiceAreaPage from "@/components/ServiceAreaPage";
import spicewoodHero from "@assets/optimized/plumber_water_heater_57dd8e1a.webp";

export default function SpicewoodServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  return (
    <ServiceAreaPage
      city="Spicewood"
      state="TX"
      slug="spicewood"
      metaDescription="Expert plumbing services in Spicewood, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Same-day service. Call (830) 460-3565."
      canonical="https://www.plumbersthatcare.com/plumber-in-spicewood--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={spicewoodHero}
      heroSubtitle="Quality plumbing services for Spicewood homes and lake properties. Specialized in water heater installations and emergency repairs."
      cityHighlight="Proudly serving Spicewood and the surrounding Hill Country area. We understand the unique plumbing needs of lakefront properties and rural homes."
    />
  );
}
