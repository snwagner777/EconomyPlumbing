/**
 * Server-Side Metadata Injector
 * 
 * Injects title, description, and canonical tags into the initial HTML
 * BEFORE sending to the client. This ensures crawlers see the correct
 * metadata even without JavaScript execution.
 * 
 * All metadata is stored in the database - no static config files.
 */

import { Request, Response, NextFunction } from 'express';
import type { IStorage } from '../storage';

const baseUrl = 'https://www.plumbersthatcare.com';

/**
 * Escape HTML entities to prevent injection
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Inject metadata into HTML
 */
function injectMetadata(html: string, title: string, description: string, canonical: string): string {
  // Escape all metadata to prevent HTML injection
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  
  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${safeTitle}</title>`
  );
  
  // Replace or add description
  if (html.includes('<meta name="description"')) {
    html = html.replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${safeDescription}">`
    );
  } else {
    html = html.replace(
      '</head>',
      `  <meta name="description" content="${safeDescription}">\n  </head>`
    );
  }
  
  // Replace or add canonical
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(
      /<link rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${safeCanonical}">`
    );
  } else {
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${safeCanonical}">\n  </head>`
    );
  }
  
  // Note: Hidden H1 tags removed as they're considered black-hat SEO
  // and cause "Multiple H1 tags" errors in SEO audits.
  // Pages should have their own visible H1 tags in the content.
  
  return html;
}

/**
 * Create metadata injection middleware
 */
export function createMetadataInjector(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    
    // Skip for API routes, assets, etc.
    if (
      path.startsWith('/api/') ||
      path.startsWith('/attached_assets/') ||
      path.includes('.') && !path.endsWith('.html') ||
      path === '/sitemap.xml' ||
      path === '/robots.txt' ||
      path === '/rss.xml'
    ) {
      return next();
    }
    
    // Check database for metadata (single source of truth)
    let metadata: { path: string; title: string; description: string; canonical?: string } | null = null;
    
    try {
      const dbMetadata = await storage.getPageMetadataByPath(path);
      if (dbMetadata) {
        metadata = {
          path: dbMetadata.path,
          title: dbMetadata.title,
          description: dbMetadata.description,
          canonical: dbMetadata.canonicalUrl || undefined,
        };
      }
    } catch (error) {
      // Database error - continue without metadata
    }
    
    // If no metadata found, check if it's a service area page
    const pathParts = path.split('/').filter(Boolean);
    if (!metadata && pathParts.length === 2 && pathParts[0] === 'service-area') {
      const slug = pathParts[1];
      
      // Try to fetch service area from database
      try {
        const serviceArea = await storage.getServiceAreaBySlug(slug);
        
        if (serviceArea) {
          metadata = {
            path,
            title: `${serviceArea.cityName} Plumber | Licensed Plumbing Services | Texas`,
            description: serviceArea.metaDescription || `Trusted plumbing services in ${serviceArea.cityName}, TX. Water heater repair, drain cleaning, emergency plumbing. Licensed plumbers.`,
          };
        }
      } catch (error) {
        // If database fetch fails, skip metadata injection for this service area
      }
    }
    
    // If no metadata found, check if it's a blog post (single-level path)
    if (!metadata && pathParts.length === 1) {
      const slug = pathParts[0];
      
      // Try to fetch blog post from database
      try {
        const posts = await storage.getBlogPosts();
        const post = posts.find(p => p.slug === slug);
        
        if (post) {
          // Use post title directly without suffix to avoid overly long titles
          // Blog titles are already SEO-optimized and descriptive
          metadata = {
            path,
            title: post.title,
            description: post.metaDescription || post.excerpt || `Read about ${post.title} from Economy Plumbing.`,
          };
        }
      } catch (error) {
        // If database fetch fails, skip metadata injection for this blog post
      }
    }
    
    // If still no metadata, let React handle it (will use default from index.html)
    if (!metadata) {
      return next();
    }
    
    // Generate canonical URL
    const canonical = metadata.canonical || `${baseUrl}${path}`;
    
    // Intercept res.write and res.end to handle both string and Buffer (production)
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalSend = res.send;
    let chunks: Buffer[] = [];
    let isHtml = false;
    
    // Check if response is HTML
    const checkHtml = () => {
      const contentType = res.getHeader('content-type');
      isHtml = contentType ? contentType.toString().includes('text/html') : false;
    };
    
    // @ts-ignore
    res.write = function(chunk: any, encoding?: any, callback?: any): boolean {
      checkHtml();
      if (isHtml && chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        if (typeof callback === 'function') callback();
        return true;
      }
      // @ts-ignore
      return originalWrite.apply(this, arguments);
    };
    
    res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
      checkHtml();
      
      if (isHtml) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }
        
        const html = Buffer.concat(chunks).toString('utf-8');
        if (html.includes('<!DOCTYPE html>')) {
          const injected = injectMetadata(html, metadata!.title, metadata!.description, canonical);
          return originalEnd.call(this, injected, 'utf-8', callback);
        }
      }
      
      // @ts-ignore
      return originalEnd.apply(this, arguments);
    };
    
    res.send = function(data: any): Response {
      // Handle string HTML
      if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
        data = injectMetadata(data, metadata!.title, metadata!.description, canonical);
      }
      // Handle Buffer HTML
      else if (Buffer.isBuffer(data)) {
        const str = data.toString('utf-8');
        if (str.includes('<!DOCTYPE html>')) {
          data = Buffer.from(injectMetadata(str, metadata!.title, metadata!.description, canonical));
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}
