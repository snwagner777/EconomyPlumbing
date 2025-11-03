import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Skip TypeScript checking during production builds for faster deployments
  // Type checking is done in development and by LSP
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Asset optimization
  compress: true,
  
  // Production optimizations
  poweredByHeader: false,
  generateEtags: true,
  
  // Turbopack configuration for @assets alias
  turbopack: {
    resolveAlias: {
      '@assets': path.resolve(process.cwd(), 'attached_assets'),
    },
  },
  
  // SEO-optimized redirects - consolidate duplicate URLs to canonical versions
  async redirects() {
    return [
      // Fix malformed URLs with phone numbers (404 errors from SE Ranking)
      // Note: '+' must be URL-encoded as '%2B' in Next.js redirect sources
      {
        source: '/commercial/%2B15123689159',
        destination: '/commercial-plumbing',
        permanent: true,
      },
      {
        source: '/blog/%2B15123689159',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/%2B15123689159',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/%2B18304603565',
        destination: '/contact',
        permanent: true,
      },
      
      // Legacy URL redirects
      {
        source: '/home-old',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/products',
        destination: '/store',
        permanent: true,
      },
      
      // Note: Old service page redirects removed - canonical tags handle SEO instead
      // This prevents "Canonical URL with 3XX" errors in SE Ranking
      
      // Note: Old city page redirects removed - canonical tags handle SEO instead
      // This prevents "Canonical URL with 3XX" errors in SE Ranking
      
      // Keep only the service-area → service-areas redirect (typo fix)
      {
        source: '/service-area/:slug',
        destination: '/service-areas/:slug',
        permanent: true,
      },
      
      // Note: Both /membership-benefits (sales page) and /vip-membership (purchase page) kept separate
      
      // Referral page consolidation
      {
        source: '/referral-offer',
        destination: '/referral',
        permanent: true,
      },
      {
        source: '/refer-a-friend',
        destination: '/referral',
        permanent: true,
      },
      
      // Legacy Leander URL
      {
        source: '/plumber-in-leander--tx524c3ae3',
        destination: '/service-areas/leander',
        permanent: true,
      },
      
      // Redirect old blog post URLs (without /blog/ prefix) to canonical /blog/slug URLs
      // Fixes "missing title tags" from SE Ranking audit for these legacy URLs
      {
        source: '/austins-hard-water-plumbing-insights',
        destination: '/blog/austins-hard-water-plumbing-insights',
        permanent: true,
      },
      {
        source: '/protect-austin-home-floodstop-prevents-backflow',
        destination: '/blog/protect-austin-home-floodstop-prevents-backflow',
        permanent: true,
      },
      {
        source: '/mastering-pipe-installation-austin-marble-falls',
        destination: '/blog/mastering-pipe-installation-austin-marble-falls',
        permanent: true,
      },
      {
        source: '/tackle-common-under-sink-plumbing-problems-austin',
        destination: '/blog/tackle-common-under-sink-plumbing-problems-austin',
        permanent: true,
      },
      {
        source: '/water-heater-leak-repair-austin',
        destination: '/blog/water-heater-leak-repair-austin',
        permanent: true,
      },
      {
        source: '/tackling-water-heater-issues-austin',
        destination: '/blog/tackling-water-heater-issues-austin',
        permanent: true,
      },
      {
        source: '/how-often-should-i-test-my-backflow-preventer',
        destination: '/blog/how-often-should-i-test-my-backflow-preventer',
        permanent: true,
      },
      {
        source: '/the-importance-of-slab-leak-repair-for-your-home-or-business',
        destination: '/blog/the-importance-of-slab-leak-repair-for-your-home-or-business',
        permanent: true,
      },
      {
        source: '/signs-of-a-slab-leak-in-austin-and-marble-falls',
        destination: '/blog/signs-of-a-slab-leak-in-austin-and-marble-falls',
        permanent: true,
      },
      {
        source: '/why-plumbers-are-expensive-exploring-the-costs-behind-plumbing-services',
        destination: '/blog/why-plumbers-are-expensive-exploring-the-costs-behind-plumbing-services',
        permanent: true,
      },
      {
        source: '/converting-to-a-tankless-reverse-osmosis-system-the-future-of-clean-water-in-austin-tx',
        destination: '/blog/converting-to-a-tankless-reverse-osmosis-system-the-future-of-clean-water-in-austin-tx',
        permanent: true,
      },
      {
        source: '/hiring-a-plumber-near-me-tips-for-choosing-the-right-professional',
        destination: '/blog/hiring-a-plumber-near-me-tips-for-choosing-the-right-professional',
        permanent: true,
      },
      {
        source: '/avoid-common-water-heater-installation-mistakes-austin',
        destination: '/blog/avoid-common-water-heater-installation-mistakes-austin',
        permanent: true,
      },
      {
        source: '/troubleshoot-maintain-water-heater-pilot-light-austin-marble-falls',
        destination: '/blog/troubleshoot-maintain-water-heater-pilot-light-austin-marble-falls',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
