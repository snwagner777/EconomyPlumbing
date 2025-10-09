import ServiceAreaPage from "@/components/ServiceAreaPage";
import bertramHero from "@assets/optimized/plumber_water_heater_1d323d32.webp";

export default function BertramServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
  ];

  return (
    <ServiceAreaPage
      city="Bertram"
      state="TX"
      slug="bertram"
      metaDescription="Professional plumbing services in Bertram, TX. Water heater install, drain cleaning, leak repair, gas services. Licensed & insured. Call (830) 460-3565."
      canonical="https://www.plumbersthatcare.com/plumber-in-bertram--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={bertramHero}
      heroSubtitle="Bertram's trusted local plumber for water heater services, drain cleaning, and emergency repairs. Honest pricing, quality work."
      cityHighlight="Proudly serving Bertram and the surrounding Burnet County area with professional plumbing services tailored to your community's needs."
    />
  );
}
