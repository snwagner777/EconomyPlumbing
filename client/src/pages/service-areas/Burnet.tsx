import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function BurnetServiceArea() {
  const nearbyCities = [
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Bertram", path: "/plumber-bertram" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" },
    { name: "Kingsland", path: "/plumber-kingsland" },
  ];

  return (
    <ServiceAreaPage
      city="Burnet"
      state="TX"
      metaDescription="Professional plumbing services in Burnet, TX. Water heater installation, drain cleaning, leak repair, and more. Licensed & insured. Call (830) 460-3565."
      canonical="https://economyplumbingservices.com/plumber-in-burnet--tx"
      area="marble-falls"
      nearbyCities={nearbyCities}
    />
  );
}
