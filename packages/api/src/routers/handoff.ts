import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const handoffSpecSchema = z.object({
  property: z.string(),
  type: z.string(),
  value: z.string(),
  description: z.string().default(''),
})

const designTokenSchema = z.object({
  name: z.string(),
  value: z.string(),
  type: z.enum(['color', 'spacing', 'typography', 'radius', 'shadow', 'opacity']),
})

const criterionSchema = z.object({
  text: z.string(),
  done: z.boolean().default(false),
})

const handoffItemSchema = z.object({
  type: z.enum(['component', 'page', 'token', 'pattern']),
  previewColor: z.string().default('#6366f1'),
  annotations: z.record(z.string(), z.unknown()).optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const handoffRouter = router({
  /* ---------- list handoff items ---------------------------------- */
  list: protectedProcedure
    .input(z.object({ productId: z.string(), type: z.enum(['all', 'component', 'page', 'token', 'pattern']).default('all') }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'handoff_item'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.updatedAt))

      if (input.type === 'all') return rows
      return rows.filter((r) => (r.data as Record<string, unknown>)?.type === input.type)
    }),

  /* ---------- get single handoff item ----------------------------- */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Handoff item not found')
      return row
    }),

  /* ---------- create handoff item --------------------------------- */
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        label: z.string(),
        item: handoffItemSchema,
        specs: z.array(handoffSpecSchema).default([]),
        tokens: z.array(designTokenSchema).default([]),
        criteria: z.array(criterionSchema).default([]),
        sourceNodeId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        ...input.item,
        specs: JSON.stringify(input.specs),
        tokens: JSON.stringify(input.tokens),
        criteria: JSON.stringify(input.criteria),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'handoff_item',
          label: input.label,
          data: data as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      if (input.sourceNodeId) {
        await ctx.db.insert(graphEdges).values({
          productId: input.productId,
          sourceId: input.sourceNodeId,
          targetId: node!.id,
          kind: 'has_handoff',
        })
      }

      ctx.eventBus.emit('handoff.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.label, type: input.item.type, userId: ctx.session.userId },
      })
      return { id: node!.id }
    }),

  /* ---------- update handoff item --------------------------------- */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        item: handoffItemSchema.partial().optional(),
        specs: z.array(handoffSpecSchema).optional(),
        tokens: z.array(designTokenSchema).optional(),
        criteria: z.array(criterionSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Handoff item not found')

      const currentData = existing.data ?? {}
      const merged = { ...currentData, ...input.item } as Record<string, unknown>
      if (input.specs) merged.specs = JSON.stringify(input.specs)
      if (input.tokens) merged.tokens = JSON.stringify(input.tokens)
      if (input.criteria) merged.criteria = JSON.stringify(input.criteria)

      await ctx.db
        .update(graphNodes)
        .set({ label: input.label ?? existing.label, data: merged, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('handoff.updated', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: existing.productId, userId: ctx.session.userId },
      })
      return { id: input.id }
    }),

  /* ---------- toggle criterion ------------------------------------ */
  toggleCriterion: protectedProcedure
    .input(z.object({ id: z.string(), criterionIndex: z.number(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Handoff item not found')

      const data = row.data ?? {}
      const rawCriteria = typeof data.criteria === 'string' ? JSON.parse(data.criteria) : data.criteria ?? []
      if (input.criterionIndex < rawCriteria.length) {
        rawCriteria[input.criterionIndex].done = input.done
      }

      await ctx.db
        .update(graphNodes)
        .set({ data: { ...data, criteria: JSON.stringify(rawCriteria) } as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      return { id: input.id }
    }),

  /* ---------- delete handoff item --------------------------------- */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Handoff item not found')

      await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('handoff.deleted', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: existing.productId, userId: ctx.session.userId },
      })
      return { id: input.id }
    }),

  /* ---------- export as markdown ---------------------------------- */
  exportMarkdown: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Handoff item not found')

      const data = row.data ?? {}
      const specs = typeof data.specs === 'string' ? JSON.parse(data.specs) : data.specs ?? []
      const tokens = typeof data.tokens === 'string' ? JSON.parse(data.tokens) : data.tokens ?? []
      const criteria = typeof data.criteria === 'string' ? JSON.parse(data.criteria) : data.criteria ?? []

      let md = `# ${row.label}\n\n**Type:** ${data.type}\n\n`
      if (specs.length) {
        md += `## Specs\n| Property | Type | Value | Description |\n|----------|------|-------|-------------|\n`
        for (const s of specs) md += `| ${s.property} | ${s.type} | ${s.value} | ${s.description} |\n`
        md += '\n'
      }
      if (tokens.length) {
        md += `## Design Tokens\n| Name | Value | Type |\n|------|-------|------|\n`
        for (const t of tokens) md += `| ${t.name} | ${t.value} | ${t.type} |\n`
        md += '\n'
      }
      if (criteria.length) {
        md += `## Acceptance Criteria\n`
        for (const c of criteria) md += `- [${c.done ? 'x' : ' '}] ${c.text}\n`
      }
      return { markdown: md }
    }),
})
