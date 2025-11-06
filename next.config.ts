import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Allow external origins for Replit development environment
  allowedDevOrigins: ['*.replit.dev'],
  
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
  
  // Security headers with CSP that allows Ecwid integration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.ecwid.com https://*.ecwid.com https://d1oxlq5h9kq8q5.cloudfront.net https://*.servicetitan.com https://static.servicetitan.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://c.clarity.ms https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://app.ecwid.com https://*.ecwid.com https://d1oxlq5h9kq8q5.cloudfront.net",
              "font-src 'self' https://fonts.gstatic.com https://*.ecwid.com https://d1oxlq5h9kq8q5.cloudfront.net data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://app.ecwid.com https://*.ecwid.com https://d1oxlq5h9kq8q5.cloudfront.net https://*.servicetitan.com https://www.google-analytics.com https://analytics.google.com https://www.facebook.com https://www.clarity.ms https://c.clarity.ms https://*.ingest.sentry.io",
              "frame-src 'self' https://app.ecwid.com https://*.ecwid.com https://js.stripe.com https://hooks.stripe.com https://www.facebook.com https://*.servicetitan.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob: https://app.ecwid.com https://*.ecwid.com",
            ].join('; '),
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
    ];
  },
};

export default nextConfig;
