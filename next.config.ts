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
      
      // Service URL consolidation - Canonical URLs
      {
        source: '/toilet-repair-services',
        destination: '/toilet-faucet',
        permanent: true,
      },
      {
        source: '/backflow-testing',
        destination: '/backflow',
        permanent: true,
      },
      {
        source: '/drain-cleaning-services',
        destination: '/drain-cleaning',
        permanent: true,
      },
      {
        source: '/emergency-plumbing',
        destination: '/emergency',
        permanent: true,
      },
      {
        source: '/gas-services',
        destination: '/gas-line-services',
        permanent: true,
      },
      {
        source: '/gas-leak-detection',
        destination: '/gas-line-services',
        permanent: true,
      },
      {
        source: '/hydro-jetting',
        destination: '/hydro-jetting-services',
        permanent: true,
      },
      {
        source: '/water-leak-repair',
        destination: '/leak-repair',
        permanent: true,
      },
      {
        source: '/water-heater-guide',
        destination: '/water-heater-services',
        permanent: true,
      },
      {
        source: '/water-heater-calculator',
        destination: '/water-heater-cost-calculator',
        permanent: true,
      },
      
      // City/Service Area URL consolidation
      {
        source: '/plumber-in-cedar-park--tx',
        destination: '/service-areas/cedar-park',
        permanent: true,
      },
      {
        source: '/round-rock-plumber',
        destination: '/service-areas/round-rock',
        permanent: true,
      },
      {
        source: '/plumber-austin',
        destination: '/service-areas/austin',
        permanent: true,
      },
      {
        source: '/plumber-leander',
        destination: '/service-areas/leander',
        permanent: true,
      },
      {
        source: '/plumber-georgetown',
        destination: '/service-areas/georgetown',
        permanent: true,
      },
      {
        source: '/plumber-pflugerville',
        destination: '/service-areas/pflugerville',
        permanent: true,
      },
      {
        source: '/plumber-kyle',
        destination: '/service-areas/kyle',
        permanent: true,
      },
      {
        source: '/plumber-buda',
        destination: '/service-areas/buda',
        permanent: true,
      },
      {
        source: '/plumber-marble-falls',
        destination: '/service-areas/marble-falls',
        permanent: true,
      },
      {
        source: '/plumber-burnet',
        destination: '/service-areas/burnet',
        permanent: true,
      },
      {
        source: '/plumber-bertram',
        destination: '/service-areas/bertram',
        permanent: true,
      },
      {
        source: '/plumber-liberty-hill',
        destination: '/service-areas/liberty-hill',
        permanent: true,
      },
      {
        source: '/plumber-spicewood',
        destination: '/service-areas/spicewood',
        permanent: true,
      },
      {
        source: '/plumber-horseshoe-bay',
        destination: '/service-areas/horseshoe-bay',
        permanent: true,
      },
      {
        source: '/plumber-granite-shoals',
        destination: '/service-areas/granite-shoals',
        permanent: true,
      },
      {
        source: '/plumber-kingsland',
        destination: '/service-areas/kingsland',
        permanent: true,
      },
      {
        source: '/plumber-near-me',
        destination: '/service-areas',
        permanent: true,
      },
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
