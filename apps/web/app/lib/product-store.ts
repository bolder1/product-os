'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trpcMutate } from './api'

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
  ) => Promise<Product>
  getProducts: (orgSlug?: string) => Product[]
  getProductBySlug: (orgSlug: string, slug: string) => Product | undefined
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  seedProducts: (orgSlug: string) => void
}

// R20: product identity palette — 8-swatch palette used to tint
// newly-created products so they can be distinguished at a glance
// across the sidebar, product switcher, and dashboard card grid.
// These are *functional* identity colors (each product keeps its
// color for life) and the value round-trips through `${color}18`
// alpha-concat patterns across ~12 consumers (see products/page.tsx,
// (dashboard)/page.tsx, command-palette-global.tsx, upstream-empty-
// state.tsx, first-run-banner.tsx, scaffold-panel.tsx). Swapping to
// `var(--accent)` would break the alpha-concat CSS silently. Kept
// literal and per-line eslint-disabled pending a Phase-2 retagging
// scheme that stores a semantic token instead of a raw hex.
const PRODUCT_COLORS = [
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#3B82F6',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#8B5CF6',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#06B6D4',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#10B981',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#F59E0B',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#EC4899',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#F43F5E',
  // eslint-disable-next-line no-hardcoded-hex -- product identity palette
  '#6366F1',
]

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],

      createProduct: async (input) => {
        const now = new Date().toISOString()
        const color = input.color ?? randomPick(PRODUCT_COLORS)
        const icon = input.icon ?? '🚀'

        // Optimistic local update
        const tempProduct: Product = {
          id: `temp-${Date.now()}`,
          name: input.name,
          description: input.description,
          slug: input.slug,
          orgSlug: input.orgSlug,
          color,
          icon,
          status: input.status ?? 'draft',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ products: [...state.products, tempProduct] }))

        // If this is the org's first product, pre-dismiss the first-run banner
        // so the onboarding UX doesn't repeat on the product page.
        try {
          const orgProducts = get().products.filter((p) => p.orgSlug === input.orgSlug)
          if (orgProducts.length === 1 && typeof window !== 'undefined') {
            const raw = localStorage.getItem('product-os-first-run-dismissed')
            const existing = raw ? (JSON.parse(raw) as string[]) : []
            if (!existing.includes(tempProduct.id)) {
              localStorage.setItem(
                'product-os-first-run-dismissed',
                JSON.stringify([...existing, tempProduct.id]),
              )
            }
          }
        } catch {}

        try {
          // Persist to DB
          const dbProduct = await trpcMutate<any>('product.create', {
            name: input.name,
            slug: input.slug,
            description: input.description,
            icon,
          })

          // Replace temp with real DB product
          const realProduct: Product = {
            id: dbProduct.id,
            name: dbProduct.name,
            description: dbProduct.description ?? '',
            slug: dbProduct.slug,
            orgSlug: input.orgSlug,
            color,
            icon: dbProduct.icon ?? icon,
            status: dbProduct.status,
            createdAt: dbProduct.createdAt,
            updatedAt: dbProduct.updatedAt,
          }
          set((state) => ({
            products: state.products.map((p) =>
              p.id === tempProduct.id ? realProduct : p
            ),
          }))

          // Carry the first-run dismissal over to the real product id
          try {
            if (typeof window !== 'undefined') {
              const raw = localStorage.getItem('product-os-first-run-dismissed')
              const existing = raw ? (JSON.parse(raw) as string[]) : []
              if (existing.includes(tempProduct.id) && !existing.includes(realProduct.id)) {
                const next = existing.filter((id) => id !== tempProduct.id).concat(realProduct.id)
                localStorage.setItem('product-os-first-run-dismissed', JSON.stringify(next))
              }
            }
          } catch {}

          return realProduct
        } catch (err) {
          // Rollback on failure
          set((state) => ({
            products: state.products.filter((p) => p.id !== tempProduct.id),
          }))
          throw err
        }
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
        // Persist to DB (fire-and-forget)
        trpcMutate('product.update', {
          id,
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.icon !== undefined && { icon: updates.icon }),
        }).catch(console.error)
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
        // Persist to DB (fire-and-forget)
        trpcMutate('product.delete', { id }).catch(console.error)
      },

      seedProducts: () => {
        // No-op — products come from the database now
      },
    }),
    {
      name: 'product-os-products',
    },
  ),
)
