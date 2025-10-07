export interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Plumber",
  "name": "Economy Plumbing Services",
  "image": "https://economyplumbingservices.com/logo.jpg",
  "logo": {
    "@type": "ImageObject",
    "url": "https://economyplumbingservices.com/logo.jpg",
    "width": "512",
    "height": "512"
  },
  "description": "Professional plumbing services in Austin and Marble Falls, Texas. Water heater repair & replacement, drain cleaning, leak repair, and emergency plumbing services.",
  "url": "https://economyplumbingservices.com",
  "telephone": [
    "+15123689159",
    "+18304603565"
  ],
  "email": "hello@plumbersthatcare.com",
  "priceRange": "$$",
  "sameAs": [
    "https://facebook.com/econoplumbing",
    "https://instagram.com/plumbersthatcare_atx",
    "https://yelp.com/biz/economy-plumbing-services-austin-3",
    "https://nextdoor.com/agency-detail/tx/austin/economy-plumbing-services/"
  ],
  "address": [
    {
      "@type": "PostalAddress",
      "streetAddress": "701 Tillery St #12",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78702",
      "addressCountry": "US"
    },
    {
      "@type": "PostalAddress",
      "streetAddress": "2409 Commerce Street",
      "addressLocality": "Marble Falls",
      "addressRegion": "TX",
      "postalCode": "78654",
      "addressCountry": "US"
    }
  ],
  "geo": [
    {
      "@type": "GeoCoordinates",
      "latitude": "30.2672",
      "longitude": "-97.7431"
    },
    {
      "@type": "GeoCoordinates",
      "latitude": "30.5744",
      "longitude": "-98.2734"
    }
  ],
  "areaServed": [
    {
      "@type": "City",
      "name": "Austin",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Cedar Park",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Leander",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Round Rock",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Georgetown",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Pflugerville",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Liberty Hill",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Buda",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Kyle",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Marble Falls",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Burnet",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Horseshoe Bay",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Kingsland",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Granite Shoals",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Bertram",
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    {
      "@type": "City",
      "name": "Spicewood",
      "containedIn": { "@type": "State", "name": "Texas" }
    }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "07:30",
      "closes": "17:30"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "245"
  }
};

export function createServiceSchema(serviceName: string, serviceDescription: string, serviceUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": serviceName,
    "description": serviceDescription,
    "provider": {
      "@type": "Plumber",
      "name": "Economy Plumbing Services",
      "telephone": ["+15123689159", "+18304603565"],
      "url": "https://economyplumbingservices.com"
    },
    "areaServed": {
      "@type": "State",
      "name": "Texas"
    },
    "url": serviceUrl
  };
}

export function createProductSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "url": `https://economyplumbingservices.com/store/checkout/${product.slug}`,
      "priceCurrency": "USD",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Economy Plumbing Services"
      }
    }
  };
}

export function createBlogPostSchema(post: any) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.publishedAt,
    "author": {
      "@type": "Organization",
      "name": "Economy Plumbing Services"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Economy Plumbing Services",
      "logo": {
        "@type": "ImageObject",
        "url": "https://economyplumbingservices.com/logo.jpg"
      }
    }
  };
}

export function createFAQSchema(faqs: { question: string; answer: string }[]) {
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
