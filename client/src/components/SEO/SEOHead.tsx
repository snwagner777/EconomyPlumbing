import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  twitterCard?: string;
  schema?: Record<string, any> | Record<string, any>[];
  articlePublishedTime?: string;
  articleAuthor?: string;
}

export function SEOHead({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  ogImageAlt = "Economy Plumbing Services - Professional Plumbers in Austin and Marble Falls, TX",
  ogImageWidth = "1200",
  ogImageHeight = "630",
  twitterCard = "summary_large_image",
  schema,
  articlePublishedTime,
  articleAuthor
}: SEOProps) {
  const [location] = useLocation();
  
  // Query database for custom metadata for this path
  const { data: dbMetadata } = useQuery({
    queryKey: ['/api/page-metadata', location],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/page-metadata?path=${encodeURIComponent(location)}`);
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    // Cache for 5 minutes to avoid excessive DB queries
    staleTime: 5 * 60 * 1000,
  });

  // Use database metadata if available, otherwise use provided defaults
  const finalTitle = dbMetadata?.title || title;
  const finalDescription = dbMetadata?.description || description;
  
  const url = canonical ?? (typeof window !== 'undefined' ? window.location.href : "https://www.plumbersthatcare.com");
  const siteName = "Economy Plumbing Services";
  
  // Always use production URL for OpenGraph images - social platforms require absolute URLs
  const productionUrl = "https://www.plumbersthatcare.com";
  
  // Use optimized 1200x630 OG image for social sharing (better for Facebook, Twitter, iMessage)
  // Add cache-busting parameter to force social platforms to refresh the image
  const fullOgImage = ogImage 
    ? (ogImage.startsWith('http') ? ogImage : `${productionUrl}${ogImage}`)
    : `${productionUrl}/attached_assets/og-image-social.jpg?v=3`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* RSS Feed */}
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title="Economy Plumbing Services Blog RSS Feed" 
        href="https://www.plumbersthatcare.com/rss.xml" 
      />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content={ogImageWidth} />
      <meta property="og:image:height" content={ogImageHeight} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={fullOgImage} />
      <meta property="twitter:image:alt" content={ogImageAlt} />

      {/* Article-specific meta tags */}
      {ogType === "article" && articlePublishedTime && (
        <meta property="article:published_time" content={articlePublishedTime} />
      )}
      {ogType === "article" && articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? schema : [schema])}
        </script>
      )}
    </Helmet>
  );
}
