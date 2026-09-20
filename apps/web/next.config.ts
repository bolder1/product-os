import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Monorepo root (pnpm workspace) — fixes flaky "Cannot find module for page" on Windows.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@ground/core', '@product-os/ui'],
}

export default nextConfig
