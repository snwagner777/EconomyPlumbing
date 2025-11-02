import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumberForSSR } from '@/server/lib/phoneNumbers';
import { storage } from '@/server/storage';
import SuccessStoriesClient from './SuccessStoriesClient';

export async function generateMetadata(): Promise<Metadata> {
  const composites = await storage.getBeforeAfterComposites();
  
  const ogImage = composites && composites.length > 0 && composites[0].jpegCompositeUrl
    ? `https://www.plumbersthatcare.com${composites[0].jpegCompositeUrl}`
    : "https://www.plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg";
  
  return await getPageMetadata('/success-stories', {
    title: 'Success Stories & Reviews - Real Customer Transformations | Economy Plumbing',
    description: 'See real before & after transformations and read reviews from satisfied customers. Economy Plumbing Services delivers quality plumbing work throughout Austin and Central Texas.',
    ogType: 'website',
    ogImage,
  });
}

export default async function SuccessStoriesPage() {
  const phoneConfig = await getPhoneNumberForSSR();
  
  // Fetch data server-side
  const [composites, customerStoriesData, reviewsData] = await Promise.all([
    storage.getBeforeAfterComposites(),
    storage.getApprovedSuccessStories(),
    storage.getGoogleReviews()
  ]);

  // Filter reviews for 4+ stars
  const reviews = reviewsData.filter(review => review.rating >= 4);
  
  // Transform customer stories to match expected format
  const customerStories = customerStoriesData || [];

  // Generate JSON-LD schemas for customer testimonials
  const testimonialSchemas = customerStories.slice(0, 10).map(story => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": story.customerName
    },
    "datePublished": new Date(story.submittedAt).toISOString(),
    "reviewBody": story.story,
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": "Economy Plumbing Services",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": story.location,
        "addressRegion": "TX",
        "addressCountry": "US"
      }
    }
  }));

  // Generate aggregate rating schema from Google reviews
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;
  
  const aggregateRatingSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Economy Plumbing Services",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": reviews.length,
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <>
      {/* JSON-LD Schema for aggregate rating */}
      {reviews.length > 0 && (
        <script

          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
        />
      )}

      {/* JSON-LD Schemas for customer testimonials */}
      {testimonialSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SuccessStoriesClient 
        composites={composites}
        customerStories={customerStories}
        reviews={reviews}
        phoneConfig={phoneConfig}
      />
    </>
  );
}
