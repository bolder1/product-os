import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const releaseChangeSchema = z.object({
  name: z.string(),
  type: z.enum(['component', 'page', 'api', 'config', 'style', 'entity', 'workflow']),
  changeType: z.enum(['added', 'modified', 'removed']),
  nodeId: z.string().optional(),
})

const releaseChecklistSchema = z.object({
  qa: z.boolean().default(false),
  stakeholder: z.boolean().default(false),
  docs: z.boolean().default(false),
  migration: z.boolean().default(false),
})

const releaseSchema = z.object({
  version: z.string(),
  title: z.string(),
  status: z.enum(['draft', 'staging', 'production', 'rolled-back']).default('draft'),
  notes: z.string().default(''),
  changes: z.array(releaseChangeSchema).default([]),
  checklist: releaseChecklistSchema.default({}),
  environment: z.string().optional(),
  deployedAt: z.string().optional(),
  rollbackReason: z.string().optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const releaseRouter = router({
  /* ---------- list releases --------------------------------------- */
  list: protectedProcedure
    .input(z.object({
      productId: z.string(),
      status: z.enum(['all', 'draft', 'staging', 'production', 'rolled-back']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'release'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.createdAt))

      if (input.status === 'all') return rows
      return rows.filter((r) => (r.data as Record<string, unknown>)?.status === input.status)
    }),

  /* ---------- get single release ---------------------------------- */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Release not found')
      return row
    }),

  /* ---------- create release -------------------------------------- */
  create: protectedProcedure
    .input(z.object({ productId: z.string(), release: releaseSchema }))
    .mutation(async ({ ctx, input }) => {
      const data = {
        ...input.release,
        changes: JSON.stringify(input.release.changes),
        checklist: JSON.stringify(input.release.checklist),
      } as Record<string, unknown>

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'release',
          label: `${input.release.version} — ${input.release.title}`,
          data,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('release.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: {
          releaseId: node!.id,
          versionId: input.release.version,
          environment: input.release.environment ?? 'draft',
          changelog: input.release.notes,
        },
      })
      return { id: node!.id }
    }),

  /* ---------- update release -------------------------------------- */
  update: protectedProcedure
    .input(z.object({ id: z.string(), release: releaseSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Release not found')

      const currentData = existing.data ?? {}
      const merged = { ...currentData } as Record<string, unknown>
      if (input.release.version !== undefined) merged.version = input.release.version
      if (input.release.title !== undefined) merged.title = input.release.title
      if (input.release.status !== undefined) merged.status = input.release.status
      if (input.release.notes !== undefined) merged.notes = input.release.notes
      if (input.release.changes !== undefined) merged.changes = JSON.stringify(input.release.changes)
      if (input.release.checklist !== undefined) merged.checklist = JSON.stringify(input.release.checklist)
      if (input.release.environment !== undefined) merged.environment = input.release.environment
      if (input.release.deployedAt !== undefined) merged.deployedAt = input.release.deployedAt

      const label = merged.version && merged.title ? `${merged.version} — ${merged.title}` : existing.label

      await ctx.db
        .update(graphNodes)
        .set({ label, data: merged, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      return { id: input.id }
    }),

  /* ---------- deploy release -------------------------------------- */
  deploy: protectedProcedure
    .input(z.object({ id: z.string(), environment: z.enum(['staging', 'production']) }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Release not found')

      const currentData = existing.data ?? {}
      const deployedAt = new Date().toISOString()

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...currentData, status: input.environment, environment: input.environment, deployedAt } as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('release.deployed', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { releaseId: input.id, environment: input.environment, deployedAt },
      })
      return { id: input.id, deployedAt }
    }),

  /* ---------- rollback release ------------------------------------ */
  rollback: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Release not found')

      const currentData = existing.data ?? {}

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...currentData, status: 'rolled-back', rollbackReason: input.reason } as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('release.rolled_back', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: {
          releaseId: input.id,
          environment: (currentData as Record<string, unknown>).environment as string ?? 'unknown',
          reason: input.reason,
          rolledBackTo: (currentData as Record<string, unknown>).version as string ?? '',
        },
      })
      return { id: input.id }
    }),

  /* ---------- update checklist ------------------------------------ */
  updateChecklist: protectedProcedure
    .input(z.object({ id: z.string(), checklist: releaseChecklistSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Release not found')

      const currentData = existing.data ?? {}
      const rawChecklist = typeof (currentData as Record<string, unknown>).checklist === 'string'
        ? JSON.parse((currentData as Record<string, unknown>).checklist as string)
        : (currentData as Record<string, unknown>).checklist ?? {}
      const checklist = { ...rawChecklist, ...input.checklist }

      await ctx.db
        .update(graphNodes)
        .set({ data: { ...currentData, checklist: JSON.stringify(checklist) } as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      return { id: input.id }
    }),

  /* ---------- delete release -------------------------------------- */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(eq(graphNodes.id, input.id))
      return { id: input.id }
    }),
})
