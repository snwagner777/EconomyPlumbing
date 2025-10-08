import { Helmet } from "react-helmet";

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
}

export function SEOHead({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  ogImageAlt = "Economy Plumbing Services - Professional Plumbers in Austin and Marble Falls, TX",
  ogImageWidth = "1024",
  ogImageHeight = "1024",
  twitterCard = "summary_large_image",
  schema
}: SEOProps) {
  const url = canonical ?? (typeof window !== 'undefined' ? window.location.href : "https://plumbersthatcare.com");
  const siteName = "Economy Plumbing Services";
  
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : "https://plumbersthatcare.com";
  
  const fullOgImage = ogImage || `${baseUrl}/attached_assets/logo.jpg`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content={ogImageWidth} />
      <meta property="og:image:height" content={ogImageHeight} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullOgImage} />
      <meta property="twitter:image:alt" content={ogImageAlt} />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? schema : [schema])}
        </script>
      )}
    </Helmet>
  );
}
