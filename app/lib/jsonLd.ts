/**
 * JSON-LD Schema Utilities for Next.js
 * Port of existing JSON-LD schemas for improved SEO
 */

export interface AggregateRating {
  ratingValue: string;
  reviewCount: string;
}

export function localBusinessSchema(aggregateRating?: AggregateRating) {
  return {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "@id": "https://www.plumbersthatcare.com/#austin",
    "name": "Economy Plumbing Services",
    "image": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
      "width": "1024",
      "height": "1024"
    },
    "description": "Professional plumbing services in Austin and Marble Falls, Texas. Water heater repair & replacement, drain cleaning, leak repair, and emergency plumbing services.",
    "url": "https://www.plumbersthatcare.com",
    "telephone": "+15123689159",
    "email": "hello@plumbersthatcare.com",
    "priceRange": "$$",
    "paymentAccepted": "Cash, Credit Card, Check",
    "currenciesAccepted": "USD",
    "hasMap": "https://maps.google.com/?q=701+Tillery+St+%2312+Austin+TX+78702",
    "sameAs": [
      "https://www.facebook.com/econoplumbing",
      "https://www.instagram.com/plumbersthatcare_atx",
      "https://www.yelp.com/biz/economy-plumbing-services-austin-3",
      "https://www.nextdoor.com/agency-detail/tx/austin/economy-plumbing-services/",
      "https://www.plumbersthatcare.com"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "701 Tillery St #12",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78702",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "30.2672",
      "longitude": "-97.7431"
    },
    "areaServed": [
      { "@type": "City", "name": "Austin", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Cedar Park", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Leander", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Round Rock", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Georgetown", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Pflugerville", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Liberty Hill", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Buda", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Kyle", "containedIn": { "@type": "State", "name": "Texas" } }
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "07:30",
        "closes": "17:30"
      }
    ],
    "aggregateRating": aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    } : {
      "@type": "AggregateRating",
      "ratingValue": "4.3",
      "reviewCount": "495",
      "bestRating": "5",
      "worstRating": "1"
    }
  };
}

export function marbleFallsLocationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Economy Plumbing Services - Marble Falls",
    "@id": "https://www.plumbersthatcare.com/#marblefalls",
    "image": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Professional plumbing services in Marble Falls and the Highland Lakes area.",
    "telephone": "+18302659944",
    "email": "hello@plumbersthatcare.com",
    "priceRange": "$$",
    "paymentAccepted": "Cash, Credit Card, Check",
    "currenciesAccepted": "USD",
    "hasMap": "https://maps.google.com/?q=2409+Commerce+Street+Marble+Falls+TX+78654",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "2409 Commerce Street",
      "addressLocality": "Marble Falls",
      "addressRegion": "TX",
      "postalCode": "78654",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "30.5744",
      "longitude": "-98.2734"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:30",
      "closes": "17:30"
    }
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Economy Plumbing Services",
    "url": "https://www.plumbersthatcare.com",
    "logo": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Professional plumbing services serving Austin, Marble Falls, and Central Texas since 2012.",
    "email": "hello@plumbersthatcare.com",
    "sameAs": [
      "https://facebook.com/econoplumbing",
      "https://instagram.com/plumbersthatcare_atx",
      "https://yelp.com/biz/economy-plumbing-services-austin-3",
      "https://nextdoor.com/agency-detail/tx/austin/economy-plumbing-services/"
    ],
    "location": [
      { "@type": "Place", "@id": "https://www.plumbersthatcare.com/#austin" },
      { "@type": "Place", "@id": "https://www.plumbersthatcare.com/#marblefalls" }
    ]
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}
