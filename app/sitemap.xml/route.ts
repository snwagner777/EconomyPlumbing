/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml for all pages
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://plumbersthatcare.com';

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/services',
    '/blog',
    '/store',
    '/vip-membership',
    '/referral',
    '/sms-signup',
    '/review-request',
    '/faq',
    '/water-heater-services',
    '/drain-cleaning',
    '/leak-repair',
    '/emergency',
    '/backflow',
    '/sewer-line-repair',
    '/repiping',
    '/hydro-jetting-services',
    '/commercial-plumbing',
    '/fixture-installation',
    '/gas-line-services',
    '/commercial/restaurants',
    '/commercial/office-buildings',
    '/commercial/retail',
    '/commercial/property-management',
    '/summer-plumbing-prep',
    '/winter-freeze-protection',
    '/service-areas',
    '/service-areas/cedar-park',
    '/service-areas/round-rock',
    '/privacy-policy',
    '/terms-of-service',
    '/refund_returns',
    '/water-heater-cost-calculator',
  ];

  // Fetch dynamic content from API routes
  let blogSlugs: string[] = [];
  let areaSlugs: string[] = [];

  try {
    const blogRes = await fetch(`${baseUrl}/api/blog`);
    if (blogRes.ok) {
      const data = await blogRes.json();
      blogSlugs = data?.map((p: { slug: string }) => p.slug) || [];
    }

    const areasRes = await fetch(`${baseUrl}/api/service-areas`);
    if (areasRes.ok) {
      const data = await areasRes.json();
      areaSlugs = data?.map((a: { slug: string }) => a.slug) || [];
    }
  } catch (error) {
    console.error('Error fetching dynamic content for sitemap:', error);
  }

  // Build sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  ${blogSlugs.map(slug => `
  <url>
    <loc>${baseUrl}/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${areaSlugs.map(slug => `
  <url>
    <loc>${baseUrl}/service-areas/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
