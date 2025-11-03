#!/usr/bin/env tsx

/**
 * Internal Links Verification Script
 * Systematically verifies all internal links in the codebase
 * Usage: npm run verify-links
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';

interface LinkResult {
  link: string;
  foundIn: string[];
  exists: boolean;
  pageFile?: string;
}

// Extract internal links from TSX/TS files
async function extractLinksFromFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf-8');
  const links: string[] = [];
  
  // Match href="/..." and to="/..."
  const hrefRegex = /(?:href|to)=["'](\/[^"']*)["']/g;
  const hrefMatches = content.matchAll(hrefRegex);
  for (const match of hrefMatches) {
    const link = match[1];
    // Exclude external links and anchors
    if (!link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('tel:')) {
      // Remove query params and hash
      const cleanLink = link.split('?')[0].split('#')[0];
      if (cleanLink && cleanLink !== '/') {
        links.push(cleanLink);
      }
    }
  }
  
  return [...new Set(links)];
}

// Recursively scan directory for TSX/TS files
async function scanDirectory(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    // Skip node_modules, .next, .git
    if (entry.isDirectory() && !['node_modules', '.next', '.git', 'dist', 'scripts'].includes(entry.name)) {
      files.push(...await scanDirectory(fullPath, baseDir));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && !entry.name.endsWith('.d.ts')) {
      // Return full path instead of relative path to avoid issues with route groups
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check if a page exists for given route
async function pageExists(route: string): Promise<{ exists: boolean; file?: string }> {
  // Handle dynamic routes in route name
  const isDynamic = route.includes('{') || route.includes('[');
  if (isDynamic) {
    // Dynamic routes always "exist" if parent directory exists
    return { exists: true, file: 'dynamic route' };
  }
  
  // Remove leading slash
  const path = route.slice(1);
  
  // Check if this path could be handled by a dynamic route
  // e.g., /store/checkout/commercial-vip → /store/checkout/[slug]
  const pathParts = path.split('/');
  if (pathParts.length > 1) {
    // Try to find a dynamic route that could handle this
    for (let i = pathParts.length - 1; i > 0; i--) {
      const basePath = pathParts.slice(0, i).join('/');
      const dynamicPath = `app/${basePath}/[slug]/page.tsx`;
      try {
        await stat(dynamicPath);
        return { exists: true, file: `${dynamicPath} (dynamic route)` };
      } catch {
        // Try [id] variant
        const dynamicIdPath = `app/${basePath}/[id]/page.tsx`;
        try {
          await stat(dynamicIdPath);
          return { exists: true, file: `${dynamicIdPath} (dynamic route)` };
        } catch {
          // Try [code] variant
          const dynamicCodePath = `app/${basePath}/[code]/page.tsx`;
          try {
            await stat(dynamicCodePath);
            return { exists: true, file: `${dynamicCodePath} (dynamic route)` };
          } catch {
            // Continue trying parent paths
          }
        }
      }
    }
  }
  
  // Remove leading slash
  const pathWithoutSlash = route.slice(1);
  
  // Check for page.tsx in app directory
  const possiblePaths = [
    `app/${pathWithoutSlash}/page.tsx`,
    `app/${pathWithoutSlash}.tsx`,
    `app/(public)/${pathWithoutSlash}/page.tsx`,
    `app/(auth)/${pathWithoutSlash}/page.tsx`,
    `app/(admin)/${pathWithoutSlash}/page.tsx`,
    `app/(customer)/${pathWithoutSlash}/page.tsx`,
    // Also check for route.ts (API routes, RSS, etc.)
    `app/${pathWithoutSlash}/route.ts`,
  ];
  
  for (const filePath of possiblePaths) {
    try {
      await stat(filePath);
      return { exists: true, file: filePath };
    } catch {
      // File doesn't exist, continue
    }
  }
  
  // Check for API routes (including routes with extensions like rss.xml)
  const apiPaths = [
    `app/api/${pathWithoutSlash}/route.ts`,
    `app/api/${pathWithoutSlash}.ts`,
    `app${route}/route.ts`, // For routes like /rss.xml, /api/success-stories/rss.xml
  ];
  
  for (const filePath of apiPaths) {
    try {
      await stat(filePath);
      return { exists: true, file: filePath };
    } catch {
      // File doesn't exist, continue
    }
  }
  
  return { exists: false };
}

// Main verification function
async function verifyInternalLinks() {
  console.log('🔍 Scanning codebase for internal links...\n');
  
  // Scan app and src directories
  const appFiles = await scanDirectory('app');
  const srcFiles = await scanDirectory('src');
  const allFiles = [...appFiles, ...srcFiles];
  
  console.log(`📁 Found ${allFiles.length} TypeScript/TSX files\n`);
  
  // Extract all links
  const linksMap = new Map<string, string[]>();
  
  for (const file of allFiles) {
    try {
      // Handle Next.js route groups - need full path
      const fullPath = file.startsWith('app/') || file.startsWith('src/') ? file : join(process.cwd(), file);
      const links = await extractLinksFromFile(fullPath);
      for (const link of links) {
        if (!linksMap.has(link)) {
          linksMap.set(link, []);
        }
        linksMap.get(link)!.push(file);
      }
    } catch (error) {
      // Skip files that can't be read
      console.error(`⚠️  Skipping ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log(`🔗 Found ${linksMap.size} unique internal links\n`);
  
  // Verify each link
  const results: LinkResult[] = [];
  const brokenLinks: LinkResult[] = [];
  
  for (const [link, foundIn] of linksMap.entries()) {
    const { exists, file } = await pageExists(link);
    const result: LinkResult = {
      link,
      foundIn,
      exists,
      pageFile: file,
    };
    results.push(result);
    
    if (!exists) {
      brokenLinks.push(result);
    }
  }
  
  // Display results
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 VERIFICATION RESULTS');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log(`✅ Working Links: ${results.length - brokenLinks.length}`);
  console.log(`❌ Broken Links:  ${brokenLinks.length}\n`);
  
  if (brokenLinks.length > 0) {
    console.log('🚨 BROKEN LINKS FOUND:\n');
    
    for (const broken of brokenLinks) {
      console.log(`❌ ${broken.link}`);
      console.log(`   Referenced in ${broken.foundIn.length} file(s):`);
      for (const file of broken.foundIn.slice(0, 3)) {
        console.log(`   - ${file}`);
      }
      if (broken.foundIn.length > 3) {
        console.log(`   ... and ${broken.foundIn.length - 3} more`);
      }
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log(`❌ FAILED: ${brokenLinks.length} broken link(s) found`);
    console.log('═══════════════════════════════════════════════════\n');
    process.exit(1);
  } else {
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SUCCESS: All internal links verified!');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Show most frequently linked pages
    const sortedResults = results.sort((a, b) => b.foundIn.length - a.foundIn.length);
    console.log('📈 Top 10 Most Linked Pages:\n');
    for (const result of sortedResults.slice(0, 10)) {
      console.log(`   ${result.foundIn.length.toString().padStart(3)}× ${result.link}`);
    }
    console.log('');
  }
}

// Run verification
verifyInternalLinks().catch((error) => {
  console.error('❌ Error running verification:', error);
  process.exit(1);
});
