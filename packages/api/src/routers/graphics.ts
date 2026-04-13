import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const graphicAssetSchema = z.object({
  type: z.enum(['illustration', 'icon', 'photo', 'logo', 'animation', 'diagram']),
  width: z.number().optional(),
  height: z.number().optional(),
  size: z.string().optional(),
  format: z.string().optional(),
  url: z.string().optional(),
  gradient: z.tuple([z.string(), z.string()]).optional(),
  tags: z.array(z.string()).default([]),
  alt: z.string().optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const graphicsRouter = router({
  /* ---------- list assets ----------------------------------------- */
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        type: z.enum(['all', 'illustration', 'icon', 'photo', 'logo', 'animation', 'diagram']).default('all'),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'asset'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.createdAt))

      let result = rows
      if (input.type !== 'all') {
        result = result.filter((r) => (r.data as Record<string, unknown>)?.type === input.type)
      }
      if (input.search) {
        const q = input.search.toLowerCase()
        result = result.filter((r) => {
          const d = r.data as Record<string, unknown>
          const rawTags = typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags ?? []
          return (
            r.label.toLowerCase().includes(q) ||
            rawTags.some((t: string) => t.toLowerCase().includes(q))
          )
        })
      }
      return result
    }),

  /* ---------- get single asset ------------------------------------ */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Graphic asset not found')
      return row
    }),

  /* ---------- create asset ---------------------------------------- */
  create: protectedProcedure
    .input(z.object({ productId: z.string(), label: z.string(), asset: graphicAssetSchema }))
    .mutation(async ({ ctx, input }) => {
      const data = {
        ...input.asset,
        tags: JSON.stringify(input.asset.tags),
        gradient: input.asset.gradient ? JSON.stringify(input.asset.gradient) : undefined,
      } as Record<string, unknown>

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'asset',
          label: input.label,
          data,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('graphics.asset.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.label, assetType: input.asset.type, userId: ctx.session.userId },
      })
      return { id: node!.id }
    }),

  /* ---------- update asset ---------------------------------------- */
  update: protectedProcedure
    .input(z.object({ id: z.string(), label: z.string().optional(), asset: graphicAssetSchema.partial().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Graphic asset not found')

      const currentData = existing.data ?? {}
      const merged = { ...currentData, ...input.asset } as Record<string, unknown>
      if (input.asset?.tags) merged.tags = JSON.stringify(input.asset.tags)
      if (input.asset?.gradient) merged.gradient = JSON.stringify(input.asset.gradient)

      await ctx.db
        .update(graphNodes)
        .set({ label: input.label ?? existing.label, data: merged, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('graphics.asset.updated', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: existing.productId, userId: ctx.session.userId },
      })
      return { id: input.id }
    }),

  /* ---------- delete asset ---------------------------------------- */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Graphic asset not found')

      await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('graphics.asset.deleted', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: existing.productId, userId: ctx.session.userId },
      })
      return { id: input.id }
    }),

  /* ---------- add tags -------------------------------------------- */
  addTags: protectedProcedure
    .input(z.object({ id: z.string(), tags: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Graphic asset not found')

      const data = row.data ?? {}
      const rawTags = typeof (data as Record<string, unknown>).tags === 'string'
        ? JSON.parse((data as Record<string, unknown>).tags as string)
        : (data as Record<string, unknown>).tags ?? []
      const existing = new Set(rawTags as string[])
      for (const t of input.tags) existing.add(t)

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...data, tags: JSON.stringify(Array.from(existing)) } as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
      return { id: input.id }
    }),

  /* ---------- remove tag ------------------------------------------ */
  removeTag: protectedProcedure
    .input(z.object({ id: z.string(), tag: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Graphic asset not found')

      const data = row.data ?? {}
      const rawTags = typeof (data as Record<string, unknown>).tags === 'string'
        ? JSON.parse((data as Record<string, unknown>).tags as string)
        : (data as Record<string, unknown>).tags ?? []
      const tags = (rawTags as string[]).filter((t) => t !== input.tag)

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...data, tags: JSON.stringify(tags) } as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
      return { id: input.id }
    }),
})
