import ServiceAreaPage from "@/components/ServiceAreaPage";
import libertyHillHero from "@assets/optimized/professional_plumber_07b42e36.webp";

export default function LibertyHillServiceArea() {
  const nearbyCities = [
    { name: "Leander", path: "/plumber-leander" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
  ];

  return (
    <ServiceAreaPage
      city="Liberty Hill"
      state="TX"
      slug="liberty-hill"
      metaDescription="Quality plumbing services in Liberty Hill, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 368-9159 for service."
      canonical="https://plumbersthatcare.com/plumber-in-liberty-hill--tx"
      area="austin"
      nearbyCities={nearbyCities}
      heroImage={libertyHillHero}
      heroSubtitle="Professional plumbing services for Liberty Hill's growing community. Same-day service, expert technicians, and upfront pricing."
      cityHighlight="As Liberty Hill continues to grow, we're here to serve both established neighborhoods and new developments with top-quality plumbing services."
    />
  );
}
