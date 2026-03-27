import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
