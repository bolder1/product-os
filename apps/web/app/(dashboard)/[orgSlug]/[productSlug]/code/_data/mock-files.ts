export interface FileNode {
  path: string
  name: string
  language: 'tsx' | 'ts' | 'css' | 'json' | 'md'
  content: string
  folder: string
}

export interface FolderNode {
  name: string
  path: string
  children: (FolderNode | FileNode)[]
}

export const mockFiles: FileNode[] = [
  {
    path: 'src/app/layout.tsx',
    name: 'layout.tsx',
    language: 'tsx',
    folder: 'src/app',
    content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Product OS',
  description: 'Unified product intelligence platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}`,
  },
  {
    path: 'src/app/page.tsx',
    name: 'page.tsx',
    language: 'tsx',
    folder: 'src/app',
    content: `import { Hero } from '@/components/hero'
import { Features } from '@/components/features'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#060918]">
      <Hero />
      <Features />
    </main>
  )
}`,
  },
  {
    path: 'src/components/hero.tsx',
    name: 'hero.tsx',
    language: 'tsx',
    folder: 'src/components',
    content: `'use client'

import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-5xl font-bold text-white mb-6">
          Build products with intelligence
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          The unified platform for product teams
        </p>
        <button className="px-8 py-3 bg-cyan-500 text-white rounded-xl">
          Get Started
        </button>
      </motion.div>
    </section>
  )
}`,
  },
  {
    path: 'src/components/features.tsx',
    name: 'features.tsx',
    language: 'tsx',
    folder: 'src/components',
    content: `'use client'

import { motion } from 'framer-motion'
import { Layers, Zap, Shield } from 'lucide-react'

const features = [
  { icon: Layers, title: 'Graph Model', desc: 'Every artifact connected' },
  { icon: Zap, title: 'AI Powered', desc: 'Intelligence at every step' },
  { icon: Shield, title: 'Enterprise Ready', desc: 'Security built in' },
]

export function Features() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <f.icon className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-lg font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-gray-400 mt-2">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}`,
  },
  {
    path: 'src/components/sidebar.tsx',
    name: 'sidebar.tsx',
    language: 'tsx',
    folder: 'src/components',
    content: `'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Settings, Users, BarChart } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/analytics', icon: BarChart, label: 'Analytics' },
  { href: '/team', icon: Users, label: 'Team' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const [active, setActive] = useState('/')

  return (
    <aside className="w-64 h-screen bg-[#0a0f1e] border-r border-white/[0.08]">
      <div className="p-4 border-b border-white/[0.08]">
        <h2 className="text-lg font-bold text-white">Product OS</h2>
      </div>
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setActive(item.href)}
            className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm \${
              active === item.href
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'text-gray-400 hover:text-white'
            }\`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}`,
  },
  {
    path: 'src/components/modal.tsx',
    name: 'modal.tsx',
    language: 'tsx',
    folder: 'src/components',
    content: `'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0a0f1e] rounded-2xl border border-white/[0.08] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}`,
  },
  {
    path: 'src/lib/utils.ts',
    name: 'utils.ts',
    language: 'ts',
    folder: 'src/lib',
    content: `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}`,
  },
  {
    path: 'src/lib/constants.ts',
    name: 'constants.ts',
    language: 'ts',
    folder: 'src/lib',
    content: `// Application constants

export const APP_NAME = 'Product OS'
export const APP_VERSION = '2.1.0'

export const THEME = {
  bg: '#060918',
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  accent: {
    cyan: '#06B6D4',
    blue: '#3B82F6',
    emerald: '#10B981',
    amber: '#F59E0B',
    violet: '#8B5CF6',
    rose: '#F43F5E',
  },
} as const

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'`,
  },
  {
    path: 'src/api/trpc/router.ts',
    name: 'router.ts',
    language: 'ts',
    folder: 'src/api/trpc',
    content: `import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

export const appRouter = t.router({
  getProduct: t.procedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      return {
        slug: input.slug,
        name: 'My Product',
        status: 'active',
      }
    }),

  listTasks: t.procedure
    .query(() => {
      return []
    }),
})

export type AppRouter = typeof appRouter`,
  },
  {
    path: 'src/styles/globals.css',
    name: 'globals.css',
    language: 'css',
    folder: 'src/styles',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #060918;
  --bg-surface: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.08);
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}`,
  },
  {
    path: 'src/styles/animations.css',
    name: 'animations.css',
    language: 'css',
    folder: 'src/styles',
    content: `/* Shared animation keyframes */

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.3); }
  50% { box-shadow: 0 0 20px 4px rgba(6, 182, 212, 0.15); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out forwards;
}`,
  },
  {
    path: 'src/pages/dashboard.tsx',
    name: 'dashboard.tsx',
    language: 'tsx',
    folder: 'src/pages',
    content: `'use client'

import { Sidebar } from '@/components/sidebar'
import { StatsGrid } from '@/components/stats-grid'

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        <StatsGrid />
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Recent Activity</h3>
            {/* Activity list */}
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Quick Actions</h3>
            {/* Actions */}
          </div>
        </div>
      </main>
    </div>
  )
}`,
  },
  {
    path: 'package.json',
    name: 'package.json',
    language: 'json',
    folder: '',
    content: `{
  "name": "product-os",
  "version": "2.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.400.0",
    "@trpc/server": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    "@types/react": "^19.0.0"
  }
}`,
  },
  {
    path: 'tsconfig.json',
    name: 'tsconfig.json',
    language: 'json',
    folder: '',
    content: `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
  },
  {
    path: 'src/components/stats-grid.tsx',
    name: 'stats-grid.tsx',
    language: 'tsx',
    folder: 'src/components',
    content: `'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, Package, Activity } from 'lucide-react'

const stats = [
  { label: 'Total Users', value: '12,847', change: '+12%', icon: Users, color: '#06B6D4' },
  { label: 'Active Products', value: '24', change: '+3', icon: Package, color: '#10B981' },
  { label: 'Tasks Complete', value: '89%', change: '+5%', icon: Activity, color: '#3B82F6' },
  { label: 'Revenue', value: '$48.2K', change: '+18%', icon: TrendingUp, color: '#F59E0B' },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            <span className="text-xs text-emerald-400">{stat.change}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
          <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  )
}`,
  },
]

// Build folder tree from flat files
export function buildFolderTree(files: FileNode[]): FolderNode {
  const root: FolderNode = { name: 'project', path: '', children: [] }

  for (const file of files) {
    const parts = file.path.split('/')
    let current = root

    // Navigate/create folders
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i]
      const folderPath = parts.slice(0, i + 1).join('/')
      let folder = current.children.find(
        (c): c is FolderNode => 'children' in c && c.name === folderName
      )
      if (!folder) {
        folder = { name: folderName, path: folderPath, children: [] }
        current.children.push(folder)
      }
      current = folder
    }

    current.children.push(file)
  }

  return root
}

export function getFileCount(node: FolderNode): number {
  let count = 0
  for (const child of node.children) {
    if ('children' in child) {
      count += getFileCount(child)
    } else {
      count++
    }
  }
  return count
}

export const languageConfig: Record<string, { color: string; label: string }> = {
  tsx: { color: '#3B82F6', label: 'TSX' },
  ts: { color: '#06B6D4', label: 'TS' },
  css: { color: '#EC4899', label: 'CSS' },
  json: { color: '#F59E0B', label: 'JSON' },
  md: { color: '#94A3B8', label: 'MD' },
}
