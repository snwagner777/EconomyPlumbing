import About from "@/pages/About";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Family-Owned Plumbing Company | Austin TX",
  description: "Family-owned plumbing company serving Central Texas since 2005. Licensed professionals specializing in water heaters and drain cleaning.",
  openGraph: {
    title: "About Economy Plumbing Services | Austin TX",
    description: "Family-owned plumbing company serving Central Texas since 2005. Licensed professionals specializing in water heaters and drain cleaning.",
    url: "https://www.plumbersthatcare.com/about",
    type: "website",
  },
};

// ISR configuration: Revalidate every hour
export const revalidate = 3600;

export default function AboutPage() {
  return <About />;
}
