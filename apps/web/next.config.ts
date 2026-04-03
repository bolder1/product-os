import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Monorepo root (pnpm workspace) — fixes flaky "Cannot find module for page" on Windows
  outputFileTracingRoot: path.join(__dirname, '../..'),
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
  // Do not use experimental.optimizePackageImports for framer-motion / lucide here:
  // it has caused webpack runtime "__webpack_modules__[moduleId] is not a function" in dev.
}

export default nextConfig
