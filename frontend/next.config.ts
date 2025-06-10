import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@udecode/plate', '@radix-ui/react-*'],
  },
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Bundle analyzer for production optimization
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size for client-side
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            editor: {
              name: 'editor',
              test: /@udecode\/plate/,
              chunks: 'all',
              enforce: true,
              priority: 20,
            },
            ui: {
              name: 'ui',
              test: /@radix-ui/,
              chunks: 'all',
              enforce: true,
              priority: 15,
            },
          },
        },
      };
    }

    return config;
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          }
        ],
      },
    ];
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Image optimization
  images: {
    domains: ['ui-avatars.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 60,
  },
  
  // Compression
  compress: true,
  
  // Power optimization for build
  poweredByHeader: false,
  
  // Static optimization
  trailingSlash: false,
  
  // Development optimization
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      position: 'bottom-right',
    },
  }),
};

export default nextConfig;
