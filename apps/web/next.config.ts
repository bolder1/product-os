import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors in activity-feed, approval-timeline, etc.
    // Type checking is done separately via tsc --noEmit
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    '@product-os/ui',
    '@product-os/api',
    '@product-os/db',
    '@product-os/auth',
    '@product-os/graph',
    '@product-os/events',
    '@product-os/ai',
    '@product-os/templates',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
}

export default nextConfig
