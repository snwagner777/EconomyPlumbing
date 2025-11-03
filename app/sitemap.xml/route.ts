/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml for SEO-optimized pages only
 * 
 * EXCLUDES:
 * - Utility pages (/leave-review, /unsubscribe, /schedule-appointment)
 * - Marketing landing pages (/referral, /sms-signup, /review-request, /commercial-services)
 * - Admin pages (/admin/*, /portal/*)
 * - Dynamic tracking pages (/ref/*, /referred-by/*)
 * - Checkout/success pages (/store/checkout/success)
 * - Email preference pages (/email-preferences)
 * 
 * INCLUDES:
 * - Main site pages (home, about, contact, services, etc.)
 * - Service pages (canonical URLs only)
 * - Blog posts (from database)
 * - Service areas (from database)
 * - Commercial industry pages
 * - Legal pages (privacy, terms, refunds)
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.plumbersthatcare.com';

  // Static pages - ONLY canonical, indexable URLs
  const staticPages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
    
    // Main pages
    { url: '/about', priority: 0.8, changefreq: 'monthly' },
    { url: '/contact', priority: 0.9, changefreq: 'monthly' },
    { url: '/services', priority: 0.9, changefreq: 'weekly' },
    { url: '/blog', priority: 0.9, changefreq: 'daily' },
    { url: '/store', priority: 0.8, changefreq: 'weekly' },
    { url: '/faq', priority: 0.7, changefreq: 'monthly' },
    { url: '/vip-membership', priority: 0.8, changefreq: 'monthly' },
    { url: '/customer-portal', priority: 0.7, changefreq: 'monthly' },
    
    // Service pages (canonical URLs only)
    { url: '/water-heater-services', priority: 0.8, changefreq: 'monthly' },
    { url: '/water-heater-guide', priority: 0.7, changefreq: 'monthly' },
    { url: '/water-heater-calculator', priority: 0.7, changefreq: 'monthly' },
    { url: '/plumbing-cost-estimator', priority: 0.7, changefreq: 'monthly' },
    { url: '/drain-cleaning', priority: 0.8, changefreq: 'monthly' },
    { url: '/leak-repair', priority: 0.8, changefreq: 'monthly' },
    { url: '/emergency', priority: 0.9, changefreq: 'monthly' },
    { url: '/backflow', priority: 0.7, changefreq: 'monthly' },
    { url: '/sewer-line-repair', priority: 0.7, changefreq: 'monthly' },
    { url: '/repiping', priority: 0.7, changefreq: 'monthly' },
    { url: '/hydro-jetting-services', priority: 0.7, changefreq: 'monthly' },
    { url: '/commercial-plumbing', priority: 0.8, changefreq: 'monthly' },
    { url: '/fixture-installation', priority: 0.7, changefreq: 'monthly' },
    { url: '/gas-line-services', priority: 0.7, changefreq: 'monthly' },
    { url: '/toilet-faucet', priority: 0.7, changefreq: 'monthly' },
    
    // Commercial industry pages
    { url: '/commercial/restaurants', priority: 0.7, changefreq: 'monthly' },
    { url: '/commercial/office-buildings', priority: 0.7, changefreq: 'monthly' },
    { url: '/commercial/retail', priority: 0.7, changefreq: 'monthly' },
    { url: '/commercial/property-management', priority: 0.7, changefreq: 'monthly' },
    
    // Seasonal pages
    { url: '/summer-plumbing-prep', priority: 0.6, changefreq: 'yearly' },
    { url: '/winter-freeze-protection', priority: 0.6, changefreq: 'yearly' },
    
    // Service areas index
    { url: '/service-areas', priority: 0.8, changefreq: 'weekly' },
    
    // Legal pages
    { url: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
    { url: '/terms-of-service', priority: 0.3, changefreq: 'yearly' },
    // Note: /refund_returns excluded (has noindex meta tag)
    
    // Success stories
    { url: '/success-stories', priority: 0.6, changefreq: 'monthly' },
  ];

  // Fetch dynamic content from API routes
  let blogPosts: Array<{ slug: string; publishDate: string }> = [];
  let areaSlugs: string[] = [];

  try {
    const blogRes = await fetch(`${baseUrl}/api/blog`);
    if (blogRes.ok) {
      const data = await blogRes.json();
      // Handle both array responses and object responses with posts property
      const posts = Array.isArray(data) ? data : (data?.posts || []);
      blogPosts = posts
        .filter((p: any) => p.slug)
        .map((p: any) => ({
          slug: p.slug,
          publishDate: p.publishDate || new Date().toISOString(),
        }));
    }

    const areasRes = await fetch(`${baseUrl}/api/service-areas`);
    if (areasRes.ok) {
      const data = await areasRes.json();
      // Handle both array responses and object responses with serviceAreas property
      const areas = Array.isArray(data) ? data : (data?.serviceAreas || data?.areas || []);
      areaSlugs = areas.map((a: { slug: string }) => a.slug).filter(Boolean);
    }
  } catch (error) {
    console.error('Error fetching dynamic content for sitemap:', error);
    // Continue with empty arrays if fetch fails
  }

  // Helper to format dates as YYYY-MM-DD for sitemap
  const formatDate = (dateStr: string | Date): string => {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  // Set lastmod dates for static pages (last known content update)
  const currentDate = new Date().toISOString().split('T')[0];
  const recentUpdateDate = '2025-11-03'; // Recent SEO/content updates

  // Build sitemap with proper formatting including lastmod dates
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${recentUpdateDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${blogPosts.map(post => `
  <url>
    <loc>${baseUrl}/${post.slug}</loc>
    <lastmod>${formatDate(post.publishDate)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${areaSlugs.map(slug => `
  <url>
    <loc>${baseUrl}/service-areas/${slug}</loc>
    <lastmod>${recentUpdateDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
