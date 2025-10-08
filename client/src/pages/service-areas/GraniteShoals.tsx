import ServiceAreaPage from "@/components/ServiceAreaPage";
import graniteShoalsHero from "@assets/stock_images/plumber_water_heater_89ac0930.jpg";

export default function GraniteShoalsServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Burnet", path: "/plumber-burnet" },
  ];

  return (
    <ServiceAreaPage
      city="Granite Shoals"
      state="TX"
      slug="granite-shoals"
      metaDescription="Reliable plumbing services in Granite Shoals, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service. Call (830) 460-3565."
      canonical="https://plumbersthatcare.com/plumber-in-granite-shoals--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={graniteShoalsHero}
      heroSubtitle="Granite Shoals plumbing specialists providing water heater services, leak repairs, and drain cleaning. Your local plumbing experts."
      cityHighlight="Located in the heart of the Highland Lakes, we provide specialized plumbing services for Granite Shoals homes and businesses."
    />
  );
}
