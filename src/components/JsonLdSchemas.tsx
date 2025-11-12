import Script from 'next/script';

interface LocalBusinessSchemaProps {
  telephone?: string;
}

interface ServiceSchemaProps {
  name: string;
  description: string;
  canonical: string;
  image?: string;
  serviceType?: string;
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageSchemaProps {
  faqs: FAQItem[];
}

export function LocalBusinessSchema({ telephone }: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "@id": "https://plumbersthatcare.com/#localbusiness",
    "name": "Economy Plumbing Services",
    "image": "https://plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg",
    "logo": "https://plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg",
    "url": "https://plumbersthatcare.com",
    "telephone": telephone || "(512) 263-0581",
    "email": "info@plumbersthatcare.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "8868 Research Blvd #402",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78758",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "30.3668",
      "longitude": "-97.7389"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "15:00"
      }
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Austin, TX"
      },
      {
        "@type": "City",
        "name": "Cedar Park, TX"
      },
      {
        "@type": "City",
        "name": "Leander, TX"
      },
      {
        "@type": "City",
        "name": "Round Rock, TX"
      },
      {
        "@type": "City",
        "name": "Georgetown, TX"
      },
      {
        "@type": "City",
        "name": "Pflugerville, TX"
      },
      {
        "@type": "City",
        "name": "Marble Falls, TX"
      }
    ],
    "priceRange": "$$",
    "sameAs": [
      "https://www.facebook.com/plumbersthatcare",
      "https://www.instagram.com/plumbersthatcare"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Plumbing Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Emergency Plumbing"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Water Heater Repair & Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Drain Cleaning"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Leak Detection & Repair"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Toilet Repair & Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Faucet Repair & Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Sewer Line Repair"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Commercial Plumbing"
          }
        }
      ]
    }
  };

  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema({
  name,
  description,
  canonical,
  image,
  serviceType,
  priceRange,
  aggregateRating,
}: ServiceSchemaProps) {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "PlumbingService",
    "name": name,
    "description": description,
    "url": canonical,
    "serviceType": serviceType || "Plumbing",
    "provider": {
      "@type": "Plumber",
      "@id": "https://plumbersthatcare.com/#localbusiness"
    },
    "areaServed": [
      { "@type": "City", "name": "Austin, TX" },
      { "@type": "City", "name": "Cedar Park, TX" },
      { "@type": "City", "name": "Leander, TX" },
      { "@type": "City", "name": "Round Rock, TX" },
      { "@type": "City", "name": "Georgetown, TX" },
      { "@type": "City", "name": "Pflugerville, TX" },
      { "@type": "City", "name": "Marble Falls, TX" }
    ]
  };

  if (image) {
    schema.image = image;
  }

  if (priceRange) {
    const numericPrice = parseFloat(priceRange);
    if (!isNaN(numericPrice)) {
      schema.offers = {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": numericPrice.toString(),
        "availability": "https://schema.org/InStock"
      };
    } else {
      schema.offers = {
        "@type": "Offer",
        "priceCurrency": "USD",
        "description": priceRange,
        "availability": "https://schema.org/InStock"
      };
    }
  }

  if (aggregateRating && aggregateRating.reviewCount >= 5) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return (
    <Script
      id={`service-schema-${name.toLowerCase().replace(/\s+/g, '-')}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Script
      id="faq-page-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

