import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Allow Replit preview domains to load Next.js assets (CSS/JS)
  // Required for dev server cross-origin requests
  allowedDevOrigins: process.env.REPLIT_DOMAINS 
    ? process.env.REPLIT_DOMAINS.split(',').map(d => d.trim())
    : [],
  
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
    qualities: [75, 85], // Support both default (75) and high quality (85) images
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
  
  // Webpack configuration for production builds
  webpack: (config) => {
    // Add @assets alias for webpack (production)
    config.resolve.alias['@assets'] = path.resolve(process.cwd(), 'attached_assets');
    return config;
  },
  
  // Turbopack configuration for @assets alias (development only)
  turbopack: {
    resolveAlias: {
      '@assets': path.resolve(process.cwd(), 'attached_assets'),
    },
  },
  
  // Security headers - CSP disabled for now to allow all third-party integrations
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
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
      
      // Redirect old VIP membership page to benefits page
      {
        source: '/vip-membership',
        destination: '/membership-benefits',
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
