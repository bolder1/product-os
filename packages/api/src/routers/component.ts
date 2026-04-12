import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */
const propDefSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'enum', 'color', 'size']),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
})

const variantDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  overrides: z.record(z.string(), z.unknown()).optional(),
})

const tokenBindingSchema = z.object({
  property: z.string(),
  tokenPath: z.string(),
  tokenValue: z.string().optional(),
})

const componentDataSchema = z.object({
  category: z.enum(['Layout', 'Form', 'Data', 'Feedback', 'Navigation']).default('Layout'),
  description: z.string().default(''),
  props: z.array(propDefSchema).default([]),
  variants: z.array(variantDefSchema).default([]),
  tokenBindings: z.array(tokenBindingSchema).default([]),
  previewCode: z.string().optional(),
  usageCount: z.number().default(0),
})

/* ------------------------------------------------------------------ */
/*  Version snapshot — stores a full copy of data at a point in time   */
/* ------------------------------------------------------------------ */
const versionSnapshotSchema = z.object({
  label: z.string(),
  data: componentDataSchema,
  createdAt: z.string(),
  createdBy: z.string().optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */
export const componentRouter = router({
  /* ---------- List components by product ----------------------------- */
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        category: z.enum(['Layout', 'Form', 'Data', 'Feedback', 'Navigation']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(graphNodes.productId, input.productId),
        eq(graphNodes.kind, 'component'),
        isNull(graphNodes.deletedAt),
      ]
      const rows = await ctx.db.select().from(graphNodes).where(and(...conditions)).orderBy(desc(graphNodes.updatedAt))

      // Optional category filter on data jsonb
      if (input.category) {
        return rows.filter((r) => (r.data as Record<string, unknown>)?.category === input.category)
      }
      return rows
    }),

  /* ---------- Get single component ---------------------------------- */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'component'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Component not found')
      return node
    }),

  /* ---------- Create component -------------------------------------- */
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: componentDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        ...input.data,
        props: JSON.stringify(input.data.props),
        variants: JSON.stringify(input.data.variants),
        tokenBindings: JSON.stringify(input.data.tokenBindings),
        versionHistory: JSON.stringify([
          {
            label: 'v1.0.0',
            data: input.data,
            createdAt: new Date().toISOString(),
            createdBy: ctx.session.userId,
          },
        ]),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'component',
          label: input.name,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('component.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.name, userId: ctx.session.userId },
      }).catch(() => {})

      return node!
    }),

  /* ---------- Update component -------------------------------------- */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: componentDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch current
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'component'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Component not found')

      const currentData = current.data as Record<string, unknown>
      const mergedData: Record<string, unknown> = { ...currentData }

      // Merge scalar fields
      if (input.data.category !== undefined) mergedData.category = input.data.category
      if (input.data.description !== undefined) mergedData.description = input.data.description
      if (input.data.previewCode !== undefined) mergedData.previewCode = input.data.previewCode
      if (input.data.usageCount !== undefined) mergedData.usageCount = input.data.usageCount

      // Merge JSON array fields
      if (input.data.props !== undefined) mergedData.props = JSON.stringify(input.data.props)
      if (input.data.variants !== undefined) mergedData.variants = JSON.stringify(input.data.variants)
      if (input.data.tokenBindings !== undefined) mergedData.tokenBindings = JSON.stringify(input.data.tokenBindings)

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          label: input.name ?? current.label,
          data: mergedData,
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      ctx.eventBus.emit('component.updated', {
        productId: updated!.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: updated!.id, productId: updated!.productId, label: updated!.label, version: updated!.version, userId: ctx.session.userId },
      }).catch(() => {})

      return updated!
    }),

  /* ---------- Save version snapshot --------------------------------- */
  saveVersion: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'component'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Component not found')

      const currentData = current.data as Record<string, unknown>
      const existingHistory = (() => {
        try { return JSON.parse(String(currentData.versionHistory || '[]')) }
        catch { return [] }
      })() as Array<{ label: string; data: unknown; createdAt: string; createdBy?: string }>

      // Snapshot current data (without versionHistory to avoid recursion)
      const { versionHistory: _, ...snapshot } = currentData

      existingHistory.push({
        label: input.label,
        data: snapshot,
        createdAt: new Date().toISOString(),
        createdBy: ctx.session.userId,
      })

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...currentData, versionHistory: JSON.stringify(existingHistory) },
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('component.version_saved', {
        productId: current.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, label: input.label, userId: ctx.session.userId },
      }).catch(() => {})

      return { versions: existingHistory.length }
    }),

  /* ---------- List version history ---------------------------------- */
  listVersions: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'component'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Component not found')

      const data = node.data as Record<string, unknown>
      try {
        return JSON.parse(String(data.versionHistory || '[]')) as Array<{
          label: string
          data: Record<string, unknown>
          createdAt: string
          createdBy?: string
        }>
      } catch {
        return []
      }
    }),

  /* ---------- Restore a version ------------------------------------- */
  restoreVersion: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        versionIndex: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'component'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Component not found')

      const data = current.data as Record<string, unknown>
      const history = (() => {
        try { return JSON.parse(String(data.versionHistory || '[]')) }
        catch { return [] }
      })() as Array<{ label: string; data: Record<string, unknown>; createdAt: string }>

      if (input.versionIndex >= history.length) throw new Error('Version index out of range')

      const restored = history[input.versionIndex]!.data as Record<string, unknown>

      const updatedRows = await ctx.db
        .update(graphNodes)
        .set({
          label: String(restored.label ?? current.label),
          data: { ...restored, versionHistory: data.versionHistory },
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()
      const updated = updatedRows[0]!

      ctx.eventBus.emit('component.version_restored', {
        productId: current.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, versionLabel: history[input.versionIndex]!.label, userId: ctx.session.userId },
      }).catch(() => {})

      return updated
    }),

  /* ---------- Delete component -------------------------------------- */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deletedRows = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'component')))
        .returning()
      const deleted = deletedRows[0]
      if (!deleted) throw new Error('Component not found')

      ctx.eventBus.emit('component.deleted', {
        productId: deleted.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: deleted.productId, userId: ctx.session.userId },
      }).catch(() => {})

      return { deleted: true }
    }),

  /* ---------- Get component usage (edges of kind uses_component) ---- */
  getUsage: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const edges = await ctx.db
        .select()
        .from(graphEdges)
        .where(and(eq(graphEdges.targetId, input.id), eq(graphEdges.kind, 'uses_component')))

      // Resolve source labels
      const sourceIds = edges.map((e) => e.sourceId)
      if (sourceIds.length === 0) return []

      const sources = await ctx.db
        .select({ id: graphNodes.id, label: graphNodes.label, kind: graphNodes.kind })
        .from(graphNodes)
        .where(and(isNull(graphNodes.deletedAt)))

      const sourceMap = new Map(sources.map((s) => [s.id, s]))

      return edges.map((e) => ({
        edgeId: e.id,
        source: sourceMap.get(e.sourceId) ?? { id: e.sourceId, label: 'Unknown', kind: 'unknown' },
        createdAt: e.createdAt,
      }))
    }),

  /* ---------- Extract component from design selection --------------- */
  extractFromDesign: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        screenNodeId: z.string().uuid(),
        name: z.string().min(1),
        elements: z.array(
          z.object({
            type: z.string(),
            width: z.number(),
            height: z.number(),
            style: z.record(z.string(), z.unknown()).optional(),
            content: z.string().optional(),
          }),
        ),
        category: z.enum(['Layout', 'Form', 'Data', 'Feedback', 'Navigation']).default('Layout'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create the component node
      const [componentNode] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'component',
          label: input.name,
          data: {
            category: input.category,
            description: `Extracted from design screen`,
            props: JSON.stringify([]),
            variants: JSON.stringify([]),
            tokenBindings: JSON.stringify([]),
            elements: JSON.stringify(input.elements),
            versionHistory: JSON.stringify([
              {
                label: 'v1.0.0 (extracted)',
                data: { elements: input.elements, category: input.category },
                createdAt: new Date().toISOString(),
                createdBy: ctx.session.userId,
              },
            ]),
          } as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      // Link screen → component via edge
      await ctx.db.insert(graphEdges).values({
        productId: input.productId,
        sourceId: input.screenNodeId,
        targetId: componentNode!.id,
        kind: 'uses_component',
      })

      ctx.eventBus.emit('component.extracted', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: componentNode!.id, screenNodeId: input.screenNodeId, label: input.name, userId: ctx.session.userId },
      }).catch(() => {})

      return componentNode!
    }),
})
