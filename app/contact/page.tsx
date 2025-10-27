import Contact from "@/pages/Contact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Schedule Plumbing Service | Austin TX",
  description: "Schedule service online or call for 24/7 emergency plumbing. Serving Austin, Marble Falls & Central TX. Call Austin: (512) 368-9159 or (830) 460-3565.",
  openGraph: {
    title: "Contact Economy Plumbing Services | Austin TX",
    description: "Schedule service online or call for 24/7 emergency plumbing. Serving Austin, Marble Falls & Central TX.",
    url: "https://www.plumbersthatcare.com/contact",
    type: "website",
  },
};

// ISR configuration: Revalidate every hour
export const revalidate = 3600;

export default function ContactPage() {
  return <Contact />;
}
