/**
 * Dynamic robots.txt generation
 * Next.js 15 App Router format
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.plumbersthatcare.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/customer-portal', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
