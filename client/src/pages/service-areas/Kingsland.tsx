import ServiceAreaPage from "@/components/ServiceAreaPage";
import kingslandHero from "@assets/optimized/plumber_working_on_p_780517d7.webp";

export default function KingslandServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  return (
    <ServiceAreaPage
      city="Kingsland"
      state="TX"
      slug="kingsland"
      metaDescription="Trusted plumbing services in Kingsland, TX. Water heater repair, drain cleaning, leak detection, commercial plumbing. Licensed plumbers. Call (830) 460-3565."
      canonical="https://www.plumbersthatcare.com/plumber-in-kingsland--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={kingslandHero}
      heroSubtitle="Kingsland plumbing services with a focus on quality and customer satisfaction. Water heaters, leaks, drains, and more."
      cityHighlight="Your trusted plumber in Kingsland and the Highland Lakes region. Fast service, competitive pricing, and guaranteed satisfaction."
    />
  );
}
