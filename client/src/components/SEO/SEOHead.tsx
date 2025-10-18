import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { generateCanonicalUrl } from "@/lib/canonicalUrl";

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
  
  // Generate canonical URL from location if not explicitly provided
  const canonicalUrl = canonical || (dbMetadata?.canonical || generateCanonicalUrl(location));
  
  const siteName = "Economy Plumbing Services";
  
  // Always use production URL for OpenGraph images - social platforms require absolute URLs
  const productionUrl = "https://www.plumbersthatcare.com";
  
  // Use site logo as default fallback for OpenGraph images
  // Blog posts and success stories should pass their hero/featured images
  const fullOgImage = ogImage 
    ? (ogImage.startsWith('http') ? ogImage : `${productionUrl}${ogImage}`)
    : `${productionUrl}/attached_assets/logo.jpg`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      {/* Canonical is handled server-side by metadataInjector for better SEO */}
      
      {/* RSS Feed */}
      <link 
        rel="alternate" 
        type="application/rss+xml" 
        title="Economy Plumbing Services Blog RSS Feed" 
        href="https://www.plumbersthatcare.com/rss.xml" 
      />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
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
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={fullOgImage} />
      <meta property="twitter:image:alt" content={ogImageAlt} />
      <meta name="twitter:site" content="@plumbersthatcare" />

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
          {JSON.stringify(Array.isArray(schema) ? schema.filter(Boolean) : [schema])}
        </script>
      )}
    </Helmet>
  );
}
