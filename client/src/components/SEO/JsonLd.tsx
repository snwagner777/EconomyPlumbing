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

// Primary Austin location - main LocalBusiness schema
export function createLocalBusinessSchema(aggregateRating?: { ratingValue: string; reviewCount: string }) {
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
    "openingHoursSpecification": {
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
    },
    "aggregateRating": aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    } : {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "89",
      "bestRating": "5",
      "worstRating": "1"
    }
  };
}

// Secondary Marble Falls location
export function createMarbleFallsLocationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Economy Plumbing Services - Marble Falls",
    "@id": "https://www.plumbersthatcare.com/#marblefalls",
    "image": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Professional plumbing services in Marble Falls and the Highland Lakes area.",
    "telephone": "+18304603565",
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
  };
}

// Organization schema to tie both locations together
export function createOrganizationSchema() {
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
      {
        "@type": "Place",
        "@id": "https://www.plumbersthatcare.com/#austin"
      },
      {
        "@type": "Place",
        "@id": "https://www.plumbersthatcare.com/#marblefalls"
      }
    ]
  };
}

export const localBusinessSchema = createLocalBusinessSchema();

export function createServiceSchema(serviceName: string, serviceDescription: string, serviceUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": serviceUrl,
    "name": serviceName,
    "serviceType": serviceName,
    "description": serviceDescription,
    "provider": {
      "@type": "Plumber",
      "@id": "https://www.plumbersthatcare.com/#austin",
      "name": "Economy Plumbing Services",
      "telephone": ["+15123689159", "+18304603565"],
      "url": "https://www.plumbersthatcare.com",
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
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.3",
        "reviewCount": "495",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
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
        "name": "Marble Falls",
        "containedIn": { "@type": "State", "name": "Texas" }
      }
    ],
    "url": serviceUrl,
    "category": "Plumbing Services"
  };
}

export function createProductSchema(product: any) {
  // Calculate price validity date (30 days from now for merchant listings)
  const priceValidUntil = new Date();
  priceValidUntil.setDate(priceValidUntil.getDate() + 30);
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image || "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "brand": {
      "@type": "Brand",
      "name": "Economy Plumbing Services"
    },
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://www.plumbersthatcare.com/store/checkout/${product.slug}`,
      "priceCurrency": "USD",
      "price": (product.price / 100).toFixed(2),
      "priceValidUntil": priceValidUntil.toISOString().split('T')[0],
      "availability": product.active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Economy Plumbing Services",
        "url": "https://www.plumbersthatcare.com"
      }
    }
  };
}

export function createBlogPostSchema(post: any) {
  const baseUrl = "https://www.plumbersthatcare.com";
  const postUrl = `${baseUrl}/${post.slug}`;
  const imageUrl = post.featuredImage ? 
    (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) : 
    `${baseUrl}/attached_assets/logo.jpg`;
  
  const publishDate = new Date(post.publishDate);
  
  // Calculate word count from content
  const wordCount = post.content ? post.content.split(/\s+/).filter((word: string) => word.length > 0).length : 0;
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": postUrl,
    "headline": post.title,
    "description": post.metaDescription || post.excerpt || post.content?.substring(0, 160) || "",
    "image": {
      "@type": "ImageObject",
      "url": imageUrl,
      "width": "1200",
      "height": "630",
      "caption": post.title
    },
    "datePublished": publishDate.toISOString(),
    "dateModified": publishDate.toISOString(),
    "author": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": post.author || "Economy Plumbing Services",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "Economy Plumbing Services",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/attached_assets/logo.jpg`,
        "width": "1024",
        "height": "1024"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "articleBody": post.content,
    "wordCount": wordCount,
    "keywords": post.category,
    "inLanguage": "en-US",
    "about": {
      "@type": "Thing",
      "name": "Plumbing Services",
      "description": "Professional plumbing services in Austin and Marble Falls, Texas"
    },
    "isPartOf": {
      "@type": "Blog",
      "@id": `${baseUrl}/blog`,
      "name": "Economy Plumbing Blog",
      "publisher": {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Economy Plumbing Services"
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

export function createBreadcrumbListSchema(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { "item": item.url })
    }))
  };
}

export function createReviewSchema(review: {
  id: string | number;
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
  timestamp?: number;
}) {
  const reviewDate = review.timestamp 
    ? new Date(review.timestamp * 1000).toISOString()
    : new Date().toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.authorName === 'Anonymous' ? 'Google Customer' : review.authorName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating.toString(),
      "bestRating": "5",
      "worstRating": "1"
    },
    "reviewBody": review.text,
    "datePublished": reviewDate,
    "itemReviewed": {
      "@type": "LocalBusiness",
      "@id": "https://www.plumbersthatcare.com",
      "name": "Economy Plumbing Services",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "701 Tillery St #12",
        "addressLocality": "Austin",
        "addressRegion": "TX",
        "postalCode": "78702",
        "addressCountry": "US"
      },
      "telephone": "+15123689159",
      "url": "https://www.plumbersthatcare.com"
    }
  };
}
