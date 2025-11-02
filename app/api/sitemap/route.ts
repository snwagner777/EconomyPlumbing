/**
 * Dynamic Sitemap XML Generation
 * 
 * Generates XML sitemap for all pages, blog posts, service areas
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

// Mark as dynamic route since we use request.headers
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || 'www.plumbersthatcare.com';
    const protocol = hostname.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${hostname}`;

    // Static pages with priorities
    const staticPages = [
      { url: '/', changefreq: 'weekly', priority: 1.0 },
      { url: '/about', changefreq: 'monthly', priority: 0.8 },
      { url: '/contact', changefreq: 'monthly', priority: 0.9 },
      { url: '/services', changefreq: 'weekly', priority: 0.9 },
      { url: '/blog', changefreq: 'daily', priority: 0.9 },
      { url: '/service-areas', changefreq: 'weekly', priority: 0.8 },
      { url: '/vip-membership', changefreq: 'monthly', priority: 0.8 },
      { url: '/faq', changefreq: 'monthly', priority: 0.7 },
    ];

    // Get dynamic content with proper error handling
    let blogPosts: any[] = [];
    let serviceAreas: any[] = [];
    let products: any[] = [];

    try {
      const results = await Promise.allSettled([
        storage.getBlogPosts(),
        storage.getAllServiceAreas(),
        storage.getProducts(),
      ]);

      blogPosts = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
      serviceAreas = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
      products = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
    } catch (error) {
      console.warn('[Sitemap] Error fetching dynamic content:', error);
      // Continue with empty arrays
    }

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add blog posts (with null check)
    if (Array.isArray(blogPosts)) {
      for (const post of blogPosts) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
        xml += `    <lastmod>${new Date(post.publishDate).toISOString().split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // Add service areas (with null check)
    if (Array.isArray(serviceAreas)) {
      for (const area of serviceAreas) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/service-areas/${area.slug}</loc>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // Add products (with null check)
    if (Array.isArray(products)) {
      for (const product of products.filter(p => p.active)) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
