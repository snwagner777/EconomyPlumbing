import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlumberNearMeClient from "@/components/PlumberNearMeClient";

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/plumber-near-me', {
    title: 'Plumber Near Me | 24/7 Emergency Plumbing Services Austin TX',
    description: 'Need a plumber near you? 24/7 emergency plumbing services in Austin, Marble Falls & surrounding areas. Licensed, insured, same-day service. Call (512) 368-9159.',
    ogType: 'website',
  });
}

export default async function PlumberNearMe() {
  const phoneConfig = await getPhoneNumbers();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Economy Plumbing Services",
    "image": "https://www.plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg",
    "description": "Licensed and insured plumbing services in Austin and Marble Falls, Texas. 24/7 emergency plumber available. Water heater repair, drain cleaning, leak repair, and more.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 30.2672,
      "longitude": -97.7431
    },
    "telephone": phoneConfig.tel,
    "priceRange": "$$",
    "openingHours": "Mo-Su 00:00-24:00",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "150"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Austin",
        "containedInPlace": {
          "@type": "State",
          "name": "Texas"
        }
      },
      {
        "@type": "City",
        "name": "Marble Falls",
        "containedInPlace": {
          "@type": "State",
          "name": "Texas"
        }
      },
      {
        "@type": "City",
        "name": "Cedar Park"
      },
      {
        "@type": "City",
        "name": "Round Rock"
      },
      {
        "@type": "City",
        "name": "Georgetown"
      },
      {
        "@type": "City",
        "name": "Leander"
      },
      {
        "@type": "City",
        "name": "Pflugerville"
      },
      {
        "@type": "City",
        "name": "Liberty Hill"
      },
      {
        "@type": "City",
        "name": "Buda"
      },
      {
        "@type": "City",
        "name": "Kyle"
      },
      {
        "@type": "City",
        "name": "Burnet"
      },
      {
        "@type": "City",
        "name": "Horseshoe Bay"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Plumbing Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Emergency Plumbing",
            "description": "24/7 emergency plumbing services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Water Heater Repair",
            "description": "Water heater installation, repair, and replacement"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Drain Cleaning",
            "description": "Professional drain cleaning and unclogging"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Leak Repair",
            "description": "Fast leak detection and repair"
          }
        }
      ]
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script

        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Header />
      <PlumberNearMeClient phoneConfig={phoneConfig} />
      <Footer />
    </div>
  );
}
