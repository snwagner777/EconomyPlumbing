import { MetadataRoute } from 'next';
import { db } from '@/server/db';
import { blogPosts, serviceAreas, pageMetadata } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Dynamic sitemap that auto-discovers all public pages from the database
 * - Queries pageMetadata table for all public pages
 * - Queries blogPosts table for blog articles
 * - Queries serviceAreas table for service area pages
 * - Excludes admin, portal, and tokenized routes
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://plumbersthatcare.com';
  
  // Patterns to exclude from sitemap
  const excludePatterns = [
    /^\/admin/,              // Admin panel
    /^\/customer-portal/,    // Customer portal
    /^\/portal/,             // Portal alias
    /^\/email-preferences\/[^/]+$/, // Tokenized email preferences
    /^\/leave-review\/[^/]+$/,      // Tokenized review forms
    /^\/ref\/[^/]+$/,               // Tokenized referral codes
    /^\/referred-by\/[^/]+$/,       // Tokenized referral tracking
    /^\/unsubscribe$/,              // Unsubscribe page (noindex)
    /^\/sms-signup$/,               // SMS signup (noindex)
    /^\/schedule-appointment$/,     // Scheduler (embedded, not standalone)
    /^\/scheduler\//,               // Scheduler success pages
    /^\/request-review$/,           // Internal review request
    /^\/review-request$/,           // Internal review request
    /^\/(public)$/,                 // Route group folder
  ];

  const shouldExclude = (path: string): boolean => {
    return excludePatterns.some(pattern => pattern.test(path));
  };

  const determinePriority = (path: string): number => {
    if (path === '/') return 1.0;
    if (path === '/contact' || path === '/services' || path === '/service-areas') return 0.9;
    if (path === '/blog' || path === '/about') return 0.8;
    if (path.startsWith('/commercial/')) return 0.7;
    if (path.includes('calculator') || path.includes('estimator') || path.includes('guide')) return 0.6;
    if (path === '/privacy-policy' || path === '/terms-of-service' || path === '/refund_returns') return 0.3;
    return 0.7; // Default for service pages, seasonal pages, etc.
  };

  const determineChangeFreq = (path: string): 'daily' | 'weekly' | 'monthly' | 'yearly' => {
    if (path === '/' || path === '/blog') return 'daily';
    if (path === '/services' || path === '/service-areas' || path === '/store') return 'weekly';
    if (path.includes('winter') || path.includes('summer')) return 'yearly';
    if (path === '/privacy-policy' || path === '/terms-of-service' || path === '/refund_returns') return 'yearly';
    return 'monthly';
  };

  // Query pageMetadata for all public pages
  let metadataEntries: MetadataRoute.Sitemap = [];
  try {
    const pages = await db.select({
      path: pageMetadata.path,
      updatedAt: pageMetadata.updatedAt,
    }).from(pageMetadata);

    metadataEntries = pages
      .filter(page => !shouldExclude(page.path))
      .map(page => ({
        url: `${baseUrl}${page.path}`,
        lastModified: page.updatedAt || new Date(),
        changeFrequency: determineChangeFreq(page.path),
        priority: determinePriority(page.path),
      }));
  } catch (error) {
    console.error('Error fetching page metadata for sitemap:', error);
  }

  // Query database for blog posts
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await db.select({
      slug: blogPosts.slug,
      publishDate: blogPosts.publishDate,
    }).from(blogPosts);

    blogEntries = posts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishDate || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Query database for service areas
  let serviceAreaEntries: MetadataRoute.Sitemap = [];
  try {
    const areas = await db.select({
      slug: serviceAreas.slug,
    }).from(serviceAreas);

    serviceAreaEntries = areas.map(area => ({
      url: `${baseUrl}/service-areas/${area.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching service areas for sitemap:', error);
  }

  // Combine all entries and sort by priority (highest first)
  const allEntries = [
    ...metadataEntries,
    ...blogEntries,
    ...serviceAreaEntries,
  ].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return allEntries;
}
