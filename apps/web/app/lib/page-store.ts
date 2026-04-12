'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DataBinding {
  sourceType: 'entity' | 'api' | 'static'
  entityId?: string
  endpoint?: string
  fieldMappings: Array<{ sectionField: string; sourceField: string }>
}

export interface SectionDef {
  id: string
  type: string
  order: number
  content: Record<string, unknown>
  dataBinding?: DataBinding
}

export interface SeoData {
  title: string
  description: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  canonical?: string
  noIndex?: boolean
  jsonLd?: Record<string, unknown>
  keywords?: string[]
}

export type PageStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived'
export type PageType = 'static' | 'dynamic' | 'landing' | 'form' | 'dashboard' | 'auth'

export interface NavItem {
  id: string
  label: string
  pageId?: string
  href?: string
  children: NavItem[]
  order: number
}

export interface PageDef {
  id: string
  label: string
  slug: string
  status: PageStatus
  pageType: PageType
  parentId: string | null
  order: number
  sections: SectionDef[]
  seo: SeoData
  navigation?: { showInNav: boolean; navOrder: number }
  publishedAt?: string
  scheduledPublishAt?: string
  version?: number
  productId?: string
}

export interface SeoValidation {
  score: number
  issues: Array<{ field: string; severity: 'error' | 'warning' | 'info'; message: string }>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let trpcMutate: ((path: string, input: unknown) => Promise<unknown>) | null = null
try {
  trpcMutate = require('./api').trpcMutate
} catch {
  trpcMutate = null
}

let trpcQuery: ((path: string, input: unknown) => Promise<unknown>) | null = null
try {
  trpcQuery = require('./api').trpcQuery
} catch {
  trpcQuery = null
}

function parsePage(raw: Record<string, unknown>): PageDef {
  const data = (raw.data ?? {}) as Record<string, unknown>

  let sections: SectionDef[] = []
  try {
    sections = typeof data.sections === 'string' ? JSON.parse(data.sections) : (data.sections as SectionDef[]) ?? []
  } catch { sections = [] }

  let seo: SeoData = { title: '', description: '' }
  try {
    seo = typeof data.seo === 'string' ? JSON.parse(data.seo) : (data.seo as SeoData) ?? { title: '', description: '' }
  } catch { /* use default */ }

  return {
    id: raw.id as string,
    label: (raw.label as string) ?? '',
    slug: (data.slug as string) ?? '/',
    status: (data.status as PageStatus) ?? 'draft',
    pageType: (data.pageType as PageType) ?? 'static',
    parentId: (data.parentId as string | null) ?? null,
    order: (data.order as number) ?? 0,
    sections,
    seo,
    navigation: data.navigation as PageDef['navigation'],
    publishedAt: data.publishedAt as string | undefined,
    scheduledPublishAt: data.scheduledPublishAt as string | undefined,
    version: (raw.version as number) ?? 1,
    productId: raw.productId as string,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface PageState {
  pages: PageDef[]
  selectedPageId: string | null
  navItems: { header: NavItem[]; footer: NavItem[]; sidebar: NavItem[] }
  seoValidation: SeoValidation | null
  loading: boolean

  // Actions
  hydrate: (productId: string) => Promise<void>
  select: (id: string | null) => void

  // CRUD
  create: (productId: string, name: string, data: Partial<PageDef>) => Promise<PageDef | null>
  update: (id: string, data: Partial<PageDef>) => Promise<void>
  remove: (id: string) => Promise<void>

  // Sections
  addSection: (pageId: string, section: SectionDef) => void
  updateSection: (pageId: string, sectionId: string, updates: Partial<SectionDef>) => void
  removeSection: (pageId: string, sectionId: string) => void
  reorderSections: (pageId: string, sectionIds: string[]) => void

  // Publishing
  publish: (id: string, scheduledAt?: string) => Promise<void>
  unpublish: (id: string, reason?: string) => Promise<void>

  // SEO
  updateSeo: (pageId: string, seo: Partial<SeoData>) => void
  validateSeo: (id: string) => Promise<SeoValidation | null>

  // Navigation
  saveNavigation: (productId: string, navType: 'header' | 'footer' | 'sidebar', items: NavItem[]) => Promise<void>
  loadNavigation: (productId: string) => Promise<void>

  // Data Binding
  bindSectionData: (pageId: string, sectionId: string, binding: DataBinding) => void
  unbindSectionData: (pageId: string, sectionId: string) => void
}

export const usePageStore = create<PageState>()(
  persist(
    (set, get) => ({
      pages: [],
      selectedPageId: null,
      navItems: { header: [], footer: [], sidebar: [] },
      seoValidation: null,
      loading: false,

      hydrate: async (productId) => {
        set({ loading: true })
        try {
          if (trpcQuery) {
            const rows = (await trpcQuery('page.list', { productId })) as Array<Record<string, unknown>>
            set({ pages: rows.map(parsePage), loading: false })
          }
        } catch {
          set({ loading: false })
        }
      },

      select: (id) => set({ selectedPageId: id, seoValidation: null }),

      create: async (productId, name, data) => {
        const tempId = `page-temp-${Date.now()}`
        const newPage: PageDef = {
          id: tempId,
          label: name,
          slug: data.slug ?? `/${name.toLowerCase().replace(/\s+/g, '-')}`,
          status: data.status ?? 'draft',
          pageType: data.pageType ?? 'static',
          parentId: data.parentId ?? null,
          order: data.order ?? get().pages.length,
          sections: data.sections ?? [],
          seo: data.seo ?? { title: name, description: '' },
          productId,
        }
        set((s) => ({ pages: [...s.pages, newPage], selectedPageId: tempId }))

        try {
          if (trpcMutate) {
            const result = (await trpcMutate('page.create', {
              productId,
              name,
              data: {
                slug: newPage.slug,
                status: newPage.status,
                pageType: newPage.pageType,
                parentId: newPage.parentId,
                order: newPage.order,
                sections: newPage.sections,
                seo: newPage.seo,
              },
            })) as Record<string, unknown>
            const created = parsePage(result)
            set((s) => ({
              pages: s.pages.map((p) => (p.id === tempId ? created : p)),
              selectedPageId: created.id,
            }))
            return created
          }
        } catch {
          set((s) => ({ pages: s.pages.filter((p) => p.id !== tempId) }))
        }
        return newPage
      },

      update: async (id, data) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...data,
                  seo: data.seo ? { ...p.seo, ...data.seo } : p.seo,
                  sections: data.sections ?? p.sections,
                }
              : p,
          ),
        }))

        try {
          if (trpcMutate) {
            const page = get().pages.find((p) => p.id === id)
            if (!page) return
            await trpcMutate('page.update', {
              id,
              name: data.label,
              data: {
                slug: data.slug,
                status: data.status,
                pageType: data.pageType,
                parentId: data.parentId,
                order: data.order,
                sections: data.sections ?? page.sections,
                seo: data.seo ? { ...page.seo, ...data.seo } : undefined,
              },
            })
          }
        } catch { /* optimistic — already applied */ }
      },

      remove: async (id) => {
        const prev = get().pages
        set((s) => ({ pages: s.pages.filter((p) => p.id !== id), selectedPageId: s.selectedPageId === id ? null : s.selectedPageId }))
        try {
          if (trpcMutate) await trpcMutate('page.delete', { id })
        } catch {
          set({ pages: prev })
        }
      },

      // Sections
      addSection: (pageId, section) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, sections: [...p.sections, section] } : p,
          ),
        }))
      },

      updateSection: (pageId, sectionId, updates) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  sections: p.sections.map((sec) =>
                    sec.id === sectionId ? { ...sec, ...updates, content: { ...sec.content, ...(updates.content ?? {}) } } : sec,
                  ),
                }
              : p,
          ),
        }))
      },

      removeSection: (pageId, sectionId) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, sections: p.sections.filter((sec) => sec.id !== sectionId) } : p,
          ),
        }))
      },

      reorderSections: (pageId, sectionIds) => {
        set((s) => ({
          pages: s.pages.map((p) => {
            if (p.id !== pageId) return p
            const ordered = sectionIds
              .map((id, i) => {
                const sec = p.sections.find((s) => s.id === id)
                return sec ? { ...sec, order: i } : null
              })
              .filter(Boolean) as SectionDef[]
            return { ...p, sections: ordered }
          }),
        }))
      },

      // Publishing
      publish: async (id, scheduledAt) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: scheduledAt ? ('approved' as const) : ('published' as const),
                  publishedAt: scheduledAt ? p.publishedAt : new Date().toISOString(),
                  scheduledPublishAt: scheduledAt,
                }
              : p,
          ),
        }))
        try {
          if (trpcMutate) await trpcMutate('page.publish', { id, scheduledAt })
        } catch { /* optimistic */ }
      },

      unpublish: async (id, reason) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, status: 'draft' as const, scheduledPublishAt: undefined } : p,
          ),
        }))
        try {
          if (trpcMutate) await trpcMutate('page.unpublish', { id, reason })
        } catch { /* optimistic */ }
      },

      // SEO
      updateSeo: (pageId, seo) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId ? { ...p, seo: { ...p.seo, ...seo } } : p,
          ),
        }))
      },

      validateSeo: async (id) => {
        try {
          if (trpcQuery) {
            const result = (await trpcQuery('page.validateSeo', { id })) as SeoValidation
            set({ seoValidation: result })
            return result
          }
        } catch { /* ignore */ }
        // Client-side fallback
        const page = get().pages.find((p) => p.id === id)
        if (!page) return null
        const issues: SeoValidation['issues'] = []
        if (!page.seo.title) issues.push({ field: 'title', severity: 'error', message: 'Missing page title' })
        else if (page.seo.title.length > 60) issues.push({ field: 'title', severity: 'warning', message: `Title is ${page.seo.title.length} chars` })
        if (!page.seo.description) issues.push({ field: 'description', severity: 'error', message: 'Missing meta description' })
        else if (page.seo.description.length > 160) issues.push({ field: 'description', severity: 'warning', message: `Description is ${page.seo.description.length} chars` })
        if (!page.seo.ogImage) issues.push({ field: 'ogImage', severity: 'info', message: 'No OG image set' })
        const score = Math.max(0, 100 - issues.filter((i) => i.severity === 'error').length * 25 - issues.filter((i) => i.severity === 'warning').length * 10 - issues.filter((i) => i.severity === 'info').length * 2)
        const result = { score, issues }
        set({ seoValidation: result })
        return result
      },

      // Navigation
      saveNavigation: async (productId, navType, items) => {
        set((s) => ({ navItems: { ...s.navItems, [navType]: items } }))
        try {
          if (trpcMutate) await trpcMutate('page.saveNavigation', { productId, navType, items })
        } catch { /* optimistic */ }
      },

      loadNavigation: async (productId) => {
        try {
          if (trpcQuery) {
            const [header, footer, sidebar] = await Promise.all([
              trpcQuery('page.getNavigation', { productId, navType: 'header' }) as Promise<NavItem[]>,
              trpcQuery('page.getNavigation', { productId, navType: 'footer' }) as Promise<NavItem[]>,
              trpcQuery('page.getNavigation', { productId, navType: 'sidebar' }) as Promise<NavItem[]>,
            ])
            set({ navItems: { header, footer, sidebar } })
          }
        } catch { /* ignore */ }
      },

      // Data Binding
      bindSectionData: (pageId, sectionId, binding) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  sections: p.sections.map((sec) =>
                    sec.id === sectionId ? { ...sec, dataBinding: binding } : sec,
                  ),
                }
              : p,
          ),
        }))
      },

      unbindSectionData: (pageId, sectionId) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  sections: p.sections.map((sec) =>
                    sec.id === sectionId ? { ...sec, dataBinding: undefined } : sec,
                  ),
                }
              : p,
          ),
        }))
      },
    }),
    {
      name: 'product-os-page-store',
      partialize: (s) => ({ pages: s.pages, navItems: s.navItems }),
    },
  ),
)
