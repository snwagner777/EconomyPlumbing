import type { NextConfig } from 'next';

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
  
  // Proxy API requests to Express server during development
  async rewrites() {
    const expressPort = process.env.EXPRESS_PORT || '5000';
    const expressUrl = process.env.EXPRESS_URL || `http://localhost:${expressPort}`;
    
    return [
      {
        source: '/api/:path*',
        destination: `${expressUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
