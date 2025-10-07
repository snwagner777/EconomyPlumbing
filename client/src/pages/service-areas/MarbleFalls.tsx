import ServiceAreaPage from "@/components/ServiceAreaPage";
import marbleFallsHero from "@assets/stock_images/plumber_fixing_sink__a8fb92e9.jpg";

export default function MarbleFallsServiceArea() {
  const nearbyCities = [
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Spicewood", path: "/plumber-spicewood" },
    { name: "Bertram", path: "/plumber-bertram" },
  ];

  return (
    <ServiceAreaPage
      city="Marble Falls"
      state="TX"
      metaDescription="Expert plumbing services in Marble Falls, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Licensed plumbers. Call (830) 460-3565."
      canonical="https://economyplumbingservices.com/plumber-in-marble-falls--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
      heroImage={marbleFallsHero}
      heroSubtitle="Marble Falls' trusted plumbing experts since 2012. Specializing in water heaters, drain cleaning, and emergency plumbing services."
      cityHighlight="Serving Marble Falls and the Highland Lakes area with comprehensive plumbing solutions. We're your local plumbing company, backed by years of experience."
    />
  );
}
