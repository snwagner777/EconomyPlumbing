import ServiceAreaPage from "@/components/ServiceAreaPage";

export default function PflugervilleServiceArea() {
  const nearbyCities = [
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Austin", path: "/service-areas/austin" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
  ];

  return (
    <ServiceAreaPage
      city="Pflugerville"
      state="TX"
      metaDescription="Trusted plumbing services in Pflugerville, TX. Water heater repair, drain cleaning, emergency plumbing, and more. Licensed & insured. Call (512) 649-2811."
      area="austin"
      nearbyCities={nearbyCities}
    />
  );
}
