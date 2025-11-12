import Script from 'next/script';
import { 
  BUSINESS_INFO, 
  AUSTIN_LOCATION, 
  MARBLE_FALLS_LOCATION,
  BUSINESS_HOURS,
  SERVICE_AREAS,
  SOCIAL_PROFILES 
} from '@/lib/businessMetadata';

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

// Next.js Script wrapper for client components
export function JsonLdScript({ 
  id, 
  data 
}: { 
  id: string; 
  data: Record<string, any> 
}) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface Review {
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
  timestamp?: number;
  reviewId?: string;
}

// Primary Austin location - main LocalBusiness schema with reviews
export function createLocalBusinessSchema(
  aggregateRating?: { ratingValue: string; reviewCount: string },
  reviews?: Review[]
) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "@id": `${BUSINESS_INFO.url}/#localbusiness`,
    "name": BUSINESS_INFO.name,
    "image": BUSINESS_INFO.logo,
    "logo": {
      "@type": "ImageObject",
      "url": BUSINESS_INFO.logo,
      "width": "1024",
      "height": "1024"
    },
    "description": BUSINESS_INFO.description,
    "url": BUSINESS_INFO.url,
    "telephone": AUSTIN_LOCATION.telephone,
    "email": BUSINESS_INFO.email,
    "priceRange": BUSINESS_INFO.priceRange,
    "paymentAccepted": "Cash, Credit Card, Check",
    "currenciesAccepted": "USD",
    "hasMap": AUSTIN_LOCATION.hasMap,
    "sameAs": SOCIAL_PROFILES,
    "address": {
      "@type": "PostalAddress",
      ...AUSTIN_LOCATION.address
    },
    "geo": {
      "@type": "GeoCoordinates",
      ...AUSTIN_LOCATION.geo
    },
    "areaServed": SERVICE_AREAS.map(area => ({
      "@type": "City",
      "name": area.name
    })),
    "openingHoursSpecification": BUSINESS_HOURS.map(hours => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": hours.dayOfWeek,
      "opens": hours.opens,
      "closes": hours.closes
    })),
    "aggregateRating": aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    } : {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "495",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // Add reviews if provided
  if (reviews && reviews.length > 0) {
    schema.review = reviews.map(review => ({
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
      "datePublished": review.timestamp 
        ? new Date(review.timestamp * 1000).toISOString()
        : new Date().toISOString()
    }));
  }

  return schema;
}

// Secondary Marble Falls location
export function createMarbleFallsLocationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": MARBLE_FALLS_LOCATION.name,
    "@id": `${BUSINESS_INFO.url}/#marblefalls`,
    "image": BUSINESS_INFO.logo,
    "description": "Professional plumbing services in Marble Falls and the Highland Lakes area.",
    "telephone": MARBLE_FALLS_LOCATION.telephone,
    "email": BUSINESS_INFO.email,
    "priceRange": BUSINESS_INFO.priceRange,
    "paymentAccepted": "Cash, Credit Card, Check",
    "currenciesAccepted": "USD",
    "hasMap": MARBLE_FALLS_LOCATION.hasMap,
    "address": {
      "@type": "PostalAddress",
      ...MARBLE_FALLS_LOCATION.address
    },
    "geo": {
      "@type": "GeoCoordinates",
      ...MARBLE_FALLS_LOCATION.geo
    },
    "openingHoursSpecification": BUSINESS_HOURS.map(hours => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": hours.dayOfWeek,
      "opens": hours.opens,
      "closes": hours.closes
    }))
  };
}

// Organization schema to tie both locations together
export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Economy Plumbing Services",
    "url": "https://www.plumbersthatcare.com",
    "logo": "https://www.plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg",
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

export function createServiceSchema(
  serviceName: string, 
  serviceDescription: string, 
  serviceUrl: string,
  serviceImage?: string,
  priceRange?: string,
  aggregateRating?: { ratingValue: number; reviewCount: number }
) {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "PlumbingService",
    "name": serviceName,
    "serviceType": serviceName,
    "description": serviceDescription,
    "url": serviceUrl,
    "provider": {
      "@type": "Plumber",
      "@id": `${BUSINESS_INFO.url}/#localbusiness`
    },
    "areaServed": SERVICE_AREAS.map(area => ({
      "@type": "City",
      "name": area.name
    })),
    "category": "Plumbing Services"
  };

  if (serviceImage) {
    schema.image = serviceImage;
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

  return schema;
}

// Service Area LocalBusiness schema (city-specific)
export function createServiceAreaSchema(
  city: string,
  state: string,
  slug: string,
  area: "austin" | "marble-falls",
  coordinates?: { latitude: string; longitude: string },
  aggregateRating?: { ratingValue: string; reviewCount: string }
) {
  const baseLocation = area === "austin" ? AUSTIN_LOCATION : MARBLE_FALLS_LOCATION;
  
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": `${BUSINESS_INFO.name} - ${city}`,
    "@id": `${BUSINESS_INFO.url}/service-areas/${slug}#localbusiness`,
    "image": BUSINESS_INFO.logo,
    "logo": {
      "@type": "ImageObject",
      "url": BUSINESS_INFO.logo
    },
    "telephone": baseLocation.telephone,
    "email": BUSINESS_INFO.email,
    "priceRange": BUSINESS_INFO.priceRange,
    "address": {
      "@type": "PostalAddress",
      ...baseLocation.address
    },
    "areaServed": {
      "@type": "City",
      "name": city
    },
    "url": `${BUSINESS_INFO.url}/service-areas/${slug}`,
    "paymentAccepted": "Cash, Credit Card, Check",
    "currenciesAccepted": "USD",
    "hasMap": `https://maps.google.com/?q=${encodeURIComponent(`${city}, ${state}`)}`,
    "provider": {
      "@type": "Plumber",
      "@id": `${BUSINESS_INFO.url}/#localbusiness`
    }
  };

  if (coordinates) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": coordinates.latitude,
      "longitude": coordinates.longitude
    };
  }

  if (aggregateRating && aggregateRating.reviewCount && parseInt(aggregateRating.reviewCount) >= 5) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return schema;
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
    "image": product.image || "https://www.plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg",
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
    `${baseUrl}/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg`;
  
  // Validate and parse publish date with fallback
  const publishDate = post.publishDate ? new Date(post.publishDate) : new Date();
  const isValidDate = publishDate instanceof Date && !isNaN(publishDate.getTime());
  const dateString = isValidDate ? publishDate.toISOString() : new Date().toISOString();
  
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
    "datePublished": dateString,
    "dateModified": dateString,
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
        "url": `${baseUrl}/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg`,
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
  // Normalize URLs by removing trailing slashes for consistency
  const normalizeUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    return url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
  };

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { "item": normalizeUrl(item.url) })
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
