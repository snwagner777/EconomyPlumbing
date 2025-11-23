'use client';

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { generateCanonicalUrl } from "@/lib/canonicalUrl";
import { useEffect } from "react";

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
  const location = usePathname() || '/';
  
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
    : `${productionUrl}/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg`;

  // Update document head dynamically (client-side only for OpenGraph/meta)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = finalTitle;
      
      // Update or create meta tags
      const updateMeta = (name: string, content: string, isProperty = false) => {
        const attr = isProperty ? 'property' : 'name';
        let element = document.querySelector(`meta[${attr}="${name}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attr, name);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      // OpenGraph
      updateMeta('og:type', ogType, true);
      updateMeta('og:url', canonicalUrl, true);
      updateMeta('og:title', finalTitle, true);
      updateMeta('og:description', finalDescription, true);
      updateMeta('og:image', fullOgImage, true);
      updateMeta('og:image:alt', ogImageAlt, true);
      updateMeta('og:image:width', ogImageWidth, true);
      updateMeta('og:image:height', ogImageHeight, true);
      updateMeta('og:site_name', siteName, true);
      updateMeta('og:locale', 'en_US', true);

      // Twitter
      updateMeta('twitter:card', twitterCard, true);
      updateMeta('twitter:url', canonicalUrl, true);
      updateMeta('twitter:title', finalTitle, true);
      updateMeta('twitter:description', finalDescription, true);
      updateMeta('twitter:image', fullOgImage, true);
      updateMeta('twitter:image:alt', ogImageAlt, true);
      updateMeta('twitter:site', '@plumbersthatcare');

      // Article-specific
      if (ogType === 'article' && articlePublishedTime) {
        updateMeta('article:published_time', articlePublishedTime, true);
      }
      if (ogType === 'article' && articleAuthor) {
        updateMeta('article:author', articleAuthor, true);
      }
    }
  }, [finalTitle, finalDescription, canonicalUrl, ogType, fullOgImage, ogImageAlt, ogImageWidth, ogImageHeight, siteName, twitterCard, articlePublishedTime, articleAuthor]);

  // Note: JSON-LD is handled by server components in page.tsx files
  // This client component only handles dynamic meta tags
  return null;
}
