import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
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
  
  // Redirects for SEO
  async redirects() {
    return [
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
      // Toilet repair canonical URL
      {
        source: '/toilet-repair-services',
        destination: '/toilet-faucet',
        permanent: true,
      },
      // Leander canonical URL
      {
        source: '/plumber-in-leander--tx524c3ae3',
        destination: '/plumber-leander',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
