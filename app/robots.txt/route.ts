/**
 * Dynamic Robots.txt Generator
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://plumbersthatcare.com';

  const robotsTxt = `# robots.txt for Economy Plumbing Services
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /customer-portal/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
