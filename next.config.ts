import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Use standalone output for production
  output: 'standalone',
  
  // Custom server handles Express integration
  reactStrictMode: true,
  
  // Image optimization for attached_assets
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Rewrites to handle legacy Express routes
  async rewrites() {
    return [
      {
        source: '/api/legacy/:path*',
        destination: '/api/express/:path*',
      },
    ];
  },
};

export default nextConfig;
