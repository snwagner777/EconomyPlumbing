import Services from "@/pages/Services";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plumbing Services Austin TX | Complete Expert Solutions",
  description: "Complete plumbing services: water heaters, drain cleaning, leak repair, gas lines and backflow testing. Licensed plumbers available 24/7. Call (512) 368-9159.",
  openGraph: {
    title: "Plumbing Services | Economy Plumbing | Austin TX",
    description: "Complete plumbing services: water heaters, drain cleaning, leak repair, gas lines and backflow testing. Licensed plumbers available 24/7.",
    url: "https://www.plumbersthatcare.com/services",
    type: "website",
  },
};

// ISR configuration: Revalidate every hour
export const revalidate = 3600;

export default function ServicesPage() {
  return <Services />;
}
