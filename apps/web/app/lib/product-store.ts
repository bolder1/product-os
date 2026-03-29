'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: string
  name: string
  description: string
  slug: string
  orgSlug: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'active' | 'archived'
}

interface ProductStore {
  products: Product[]
  createProduct: (
    product: Pick<Product, 'name' | 'description' | 'slug' | 'orgSlug'> &
      Partial<Pick<Product, 'color' | 'icon' | 'status'>>,
  ) => Product
  getProducts: (orgSlug?: string) => Product[]
  getProductBySlug: (orgSlug: string, slug: string) => Product | undefined
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  seedProducts: (orgSlug: string) => void
}

const PRODUCT_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#F43F5E',
  '#6366F1',
]

const PRODUCT_ICONS = ['🚀', '📦', '🎯', '💡', '⚡', '🔮', '🛠️', '🌐']

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],

      createProduct: (input) => {
        const now = new Date().toISOString()
        const product: Product = {
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          slug: input.slug,
          orgSlug: input.orgSlug,
          color: input.color ?? randomPick(PRODUCT_COLORS),
          icon: input.icon ?? randomPick(PRODUCT_ICONS),
          status: input.status ?? 'draft',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ products: [...state.products, product] }))
        return product
      },

      getProducts: (orgSlug) => {
        const { products } = get()
        if (!orgSlug) return products
        return products.filter((p) => p.orgSlug === orgSlug)
      },

      getProductBySlug: (orgSlug, slug) => {
        return get().products.find(
          (p) => p.orgSlug === orgSlug && p.slug === slug,
        )
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p,
          ),
        }))
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
      },

      seedProducts: (orgSlug) => {
        const { products } = get()
        if (products.some((p) => p.orgSlug === orgSlug)) return

        const seeds: Array<
          Pick<Product, 'name' | 'slug' | 'description' | 'icon' | 'color' | 'status'>
        > = [
          {
            name: 'Mobile Banking App',
            slug: 'mobile-banking-app',
            description:
              'Next-gen mobile banking experience with AI-powered insights',
            icon: '🏦',
            color: '#3B82F6',
            status: 'active',
          },
          {
            name: 'E-Commerce Platform',
            slug: 'e-commerce-platform',
            description:
              'Full-stack commerce solution with headless architecture',
            icon: '🛒',
            color: '#10B981',
            status: 'active',
          },
          {
            name: 'Analytics Dashboard',
            slug: 'analytics-dashboard',
            description:
              'Real-time analytics and reporting for product teams',
            icon: '📊',
            color: '#8B5CF6',
            status: 'draft',
          },
        ]

        const now = new Date().toISOString()
        const seeded = seeds.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          orgSlug,
          createdAt: now,
          updatedAt: now,
        }))

        set((state) => ({
          products: [...state.products, ...seeded],
        }))
      },
    }),
    {
      name: 'product-os-products',
    },
  ),
)
