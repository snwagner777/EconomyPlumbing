/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for deployment (includes only necessary files)
  output: 'standalone',
  
  // Disable static exports - we need server-side rendering and ISR
  // output: 'export' would break ISR and server components
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images with Next.js Image component
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  
  // Custom webpack configuration for compatibility
  webpack: (config, { isServer }) => {
    // Fixes for ESM packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Experimental features for App Router
  experimental: {
    // Enable partial pre-rendering for better performance
    ppr: false,
    
    // Server actions for forms
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // No rewrites needed - Express and Next.js run on same port
  // Express middleware is mounted before Next.js, so it handles /api/* and /attached_assets/* directly
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
  
  // Redirects for old URLs (can move these from Express to Next.js)
  async redirects() {
    return [
      // Legacy blog post redirects - remove /blog/ prefix
      {
        source: '/blog/:slug',
        destination: '/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
