import Blog from "@/pages/Blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plumbing Tips & Advice Blog | Economy Plumbing",
  description: "Austin & Marble Falls plumbing tips: water heater maintenance, drain care, leak prevention & home maintenance guides. Expert advice from Economy Plumbing.",
  openGraph: {
    title: "Plumbing Tips & Advice Blog | Economy Plumbing",
    description: "Austin & Marble Falls plumbing tips: water heater maintenance, drain care, leak prevention & home maintenance guides. Expert advice from Economy Plumbing.",
    url: "https://www.plumbersthatcare.com/blog",
    type: "website",
  },
};

// ISR configuration: Revalidate every hour for blog listing
export const revalidate = 3600;

export default function BlogPage() {
  return <Blog />;
}
