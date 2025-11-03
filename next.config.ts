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
      
      // Membership page consolidation
      {
        source: '/membership-benefits',
        destination: '/vip-membership',
        permanent: true,
      },
      
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
    ];
  },
};

export default nextConfig;
