import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const sectionDefSchema = z.object({
  id: z.string(),
  type: z.string(),
  order: z.number(),
  content: z.record(z.string(), z.unknown()),
  dataBinding: z
    .object({
      sourceType: z.enum(['entity', 'api', 'static']).default('static'),
      entityId: z.string().optional(),
      endpoint: z.string().optional(),
      fieldMappings: z
        .array(
          z.object({
            sectionField: z.string(),
            sourceField: z.string(),
          }),
        )
        .default([]),
    })
    .optional(),
})

const seoSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  ogImage: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  canonical: z.string().optional(),
  noIndex: z.boolean().optional(),
  jsonLd: z.record(z.string(), z.unknown()).optional(),
  keywords: z.array(z.string()).optional(),
})

const navItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    pageId: z.string().optional(),
    href: z.string().optional(),
    children: z.array(navItemSchema).default([]),
    order: z.number().default(0),
  }),
)

interface NavItem {
  id: string
  label: string
  pageId?: string
  href?: string
  children: NavItem[]
  order: number
}

const pageDataSchema = z.object({
  slug: z.string().default('/'),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).default('draft'),
  parentId: z.string().nullable().default(null),
  order: z.number().default(0),
  pageType: z.enum(['static', 'dynamic', 'landing', 'form', 'dashboard', 'auth']).default('static'),
  sections: z.array(sectionDefSchema).default([]),
  seo: seoSchema.default({}),
  navigation: z
    .object({
      showInNav: z.boolean().default(true),
      navOrder: z.number().default(0),
    })
    .optional(),
  publishedAt: z.string().optional(),
  scheduledPublishAt: z.string().optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */
export const pageRouter = router({
  /* ---------- List pages by product --------------------------------- */
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(graphNodes.productId, input.productId),
        eq(graphNodes.kind, 'page'),
        isNull(graphNodes.deletedAt),
      ]
      const rows = await ctx.db.select().from(graphNodes).where(and(...conditions)).orderBy(desc(graphNodes.updatedAt))

      if (input.status) {
        return rows.filter((r) => (r.data as Record<string, unknown>)?.status === input.status)
      }
      return rows
    }),

  /* ---------- Get single page --------------------------------------- */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'page'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Page not found')
      return node
    }),

  /* ---------- Create page ------------------------------------------- */
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: pageDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        ...input.data,
        sections: JSON.stringify(input.data.sections),
        seo: JSON.stringify(input.data.seo),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'page',
          label: input.name,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      // If page has a parentId, create a contains edge
      if (input.data.parentId) {
        await ctx.db.insert(graphEdges).values({
          productId: input.productId,
          sourceId: input.data.parentId,
          targetId: node!.id,
          kind: 'contains',
        })
      }

      ctx.eventBus
        .emit('page.created', {
          productId: input.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: node!.id, productId: input.productId, label: input.name, slug: input.data.slug, userId: ctx.session.userId },
        })
        .catch(() => {})

      return node!
    }),

  /* ---------- Update page ------------------------------------------- */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: pageDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'page'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Page not found')

      const currentData = current.data as Record<string, unknown>
      const merged: Record<string, unknown> = { ...currentData }

      if (input.data.slug !== undefined) merged.slug = input.data.slug
      if (input.data.status !== undefined) merged.status = input.data.status
      if (input.data.parentId !== undefined) merged.parentId = input.data.parentId
      if (input.data.order !== undefined) merged.order = input.data.order
      if (input.data.pageType !== undefined) merged.pageType = input.data.pageType
      if (input.data.sections !== undefined) merged.sections = JSON.stringify(input.data.sections)
      if (input.data.seo !== undefined) merged.seo = JSON.stringify(input.data.seo)
      if (input.data.navigation !== undefined) merged.navigation = input.data.navigation
      if (input.data.publishedAt !== undefined) merged.publishedAt = input.data.publishedAt
      if (input.data.scheduledPublishAt !== undefined) merged.scheduledPublishAt = input.data.scheduledPublishAt

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          label: input.name ?? current.label,
          data: merged,
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      ctx.eventBus
        .emit('page.updated', {
          productId: updated!.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: updated!.id, productId: updated!.productId, label: updated!.label, version: updated!.version, userId: ctx.session.userId },
        })
        .catch(() => {})

      return updated!
    }),

  /* ---------- Publish page ------------------------------------------ */
  publish: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        scheduledAt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'page'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Page not found')

      const currentData = current.data as Record<string, unknown>
      const now = new Date()

      const updatedData: Record<string, unknown> = {
        ...currentData,
        status: input.scheduledAt ? 'approved' : 'published',
        publishedAt: input.scheduledAt ? currentData.publishedAt : now.toISOString(),
        scheduledPublishAt: input.scheduledAt ?? undefined,
      }

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          data: updatedData,
          version: (current.version ?? 1) + 1,
          updatedAt: now,
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      ctx.eventBus
        .emit('page.published', {
          productId: updated!.productId,
          actorId: ctx.session.userId,
          payload: {
            pageId: input.id,
            slug: String(currentData.slug ?? '/'),
            title: updated!.label,
            publishedAt: input.scheduledAt ?? now.toISOString(),
          },
        })
        .catch(() => {})

      return updated!
    }),

  /* ---------- Unpublish page ---------------------------------------- */
  unpublish: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'page'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Page not found')

      const currentData = current.data as Record<string, unknown>

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          data: { ...currentData, status: 'draft', scheduledPublishAt: undefined },
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      ctx.eventBus
        .emit('page.unpublished', {
          productId: updated!.productId,
          actorId: ctx.session.userId,
          payload: { pageId: input.id, slug: String(currentData.slug ?? '/'), reason: input.reason },
        })
        .catch(() => {})

      return updated!
    }),

  /* ---------- Delete page ------------------------------------------- */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'page')))
        .returning()
      if (!deleted) throw new Error('Page not found')

      ctx.eventBus
        .emit('page.deleted', {
          productId: deleted.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: input.id, productId: deleted.productId, userId: ctx.session.userId },
        })
        .catch(() => {})

      return { deleted: true }
    }),

  /* ---------- Get page tree (hierarchical) -------------------------- */
  getTree: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.productId, input.productId), eq(graphNodes.kind, 'page'), isNull(graphNodes.deletedAt)))
        .orderBy(desc(graphNodes.updatedAt))

      // Build tree structure
      type PageNode = { id: string; label: string; data: Record<string, unknown>; children: PageNode[] }
      const nodeMap = new Map<string, PageNode>()
      const roots: PageNode[] = []

      for (const row of rows) {
        nodeMap.set(row.id, { id: row.id, label: row.label, data: row.data as Record<string, unknown>, children: [] })
      }

      for (const row of rows) {
        const data = row.data as Record<string, unknown>
        const parentId = data.parentId as string | null
        const node = nodeMap.get(row.id)!
        if (parentId && nodeMap.has(parentId)) {
          nodeMap.get(parentId)!.children.push(node)
        } else {
          roots.push(node)
        }
      }

      return roots
    }),

  /* ---------- Save / get navigation config -------------------------- */
  saveNavigation: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        navType: z.enum(['header', 'footer', 'sidebar']),
        items: z.array(navItemSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Store navigation as a special graph node
      const existing = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'route'),
            isNull(graphNodes.deletedAt),
          ),
        )

      const navNode = existing.find(
        (n) => (n.data as Record<string, unknown>)?.navType === input.navType,
      )

      if (navNode) {
        await ctx.db
          .update(graphNodes)
          .set({
            data: { navType: input.navType, items: JSON.stringify(input.items) },
            updatedAt: new Date(),
          })
          .where(eq(graphNodes.id, navNode.id))
      } else {
        await ctx.db.insert(graphNodes).values({
          productId: input.productId,
          kind: 'route',
          label: `${input.navType}-navigation`,
          data: { navType: input.navType, items: JSON.stringify(input.items) } as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
      }

      return { saved: true }
    }),

  getNavigation: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        navType: z.enum(['header', 'footer', 'sidebar']),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'route'),
            isNull(graphNodes.deletedAt),
          ),
        )

      const navNode = rows.find(
        (n) => (n.data as Record<string, unknown>)?.navType === input.navType,
      )
      if (!navNode) return []

      const data = navNode.data as Record<string, unknown>
      try {
        return JSON.parse(String(data.items || '[]')) as NavItem[]
      } catch {
        return []
      }
    }),

  /* ---------- Validate SEO ------------------------------------------ */
  validateSeo: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'page'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Page not found')

      const data = node.data as Record<string, unknown>
      const seo = (() => {
        try { return typeof data.seo === 'string' ? JSON.parse(data.seo) : data.seo ?? {} }
        catch { return {} }
      })() as Record<string, unknown>

      const issues: Array<{ field: string; severity: 'error' | 'warning' | 'info'; message: string }> = []

      const title = String(seo.title || '')
      const desc = String(seo.description || '')

      if (!title) issues.push({ field: 'title', severity: 'error', message: 'Missing page title' })
      else if (title.length > 60) issues.push({ field: 'title', severity: 'warning', message: `Title is ${title.length} chars (recommended: under 60)` })
      else if (title.length < 10) issues.push({ field: 'title', severity: 'warning', message: 'Title is very short' })

      if (!desc) issues.push({ field: 'description', severity: 'error', message: 'Missing meta description' })
      else if (desc.length > 160) issues.push({ field: 'description', severity: 'warning', message: `Description is ${desc.length} chars (recommended: under 160)` })
      else if (desc.length < 50) issues.push({ field: 'description', severity: 'warning', message: 'Description is very short' })

      if (!seo.ogTitle && !title) issues.push({ field: 'ogTitle', severity: 'info', message: 'No OG title set' })
      if (!seo.ogDescription && !desc) issues.push({ field: 'ogDescription', severity: 'info', message: 'No OG description set' })
      if (!seo.ogImage) issues.push({ field: 'ogImage', severity: 'info', message: 'No OG image set' })

      const slug = String(data.slug || '')
      if (!slug) issues.push({ field: 'slug', severity: 'error', message: 'Missing URL slug' })

      const score = Math.max(0, 100 - issues.filter((i) => i.severity === 'error').length * 25 - issues.filter((i) => i.severity === 'warning').length * 10 - issues.filter((i) => i.severity === 'info').length * 2)

      return { score, issues }
    }),
})
