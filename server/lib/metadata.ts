import { storage } from '@/server/storage';
import type { Metadata } from 'next';

/**
 * Server-side metadata helper for Next.js
 * Fetches custom metadata from admin panel database
 */

interface MetadataDefaults {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

/**
 * Get page metadata from database with fallback to defaults
 * Use this in generateMetadata() functions
 */
export async function getPageMetadata(path: string, defaults?: MetadataDefaults): Promise<Metadata> {
  try {
    // Fetch from database (admin panel managed)
    const dbMetadata = await storage.getPageMetadataByPath(path);
    
    const title = dbMetadata?.title || defaults?.title || 'Economy Plumbing Services';
    const description = dbMetadata?.description || defaults?.description || 'Professional plumbing services in Austin and Central Texas';
    const canonicalUrl = dbMetadata?.canonicalUrl || `https://plumbersthatcare.com${path}`;
    const ogImage = defaults?.ogImage || 'https://plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg';
    
    return {
      title,
      description,
      keywords: dbMetadata?.keywords,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Economy Plumbing Services',
        type: defaults?.ogType || 'website',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: 'Economy Plumbing Services',
          },
        ],
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
        site: '@plumbersthatcare',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('[Metadata] Error fetching metadata for path:', path, error);
    
    // Return safe defaults on error
    return {
      title: defaults?.title || 'Economy Plumbing Services',
      description: defaults?.description || 'Professional plumbing services in Austin and Central Texas',
    };
  }
}

/**
 * Simple version for pages that just need title/description from database
 */
export async function getSimpleMetadata(path: string): Promise<{ title: string; description: string } | null> {
  try {
    const metadata = await storage.getPageMetadataByPath(path);
    if (!metadata) return null;
    
    return {
      title: metadata.title,
      description: metadata.description,
    };
  } catch (error) {
    console.error('[Metadata] Error fetching metadata for path:', path, error);
    return null;
  }
}
