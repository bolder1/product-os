import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const testCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['passed', 'failed', 'skipped', 'pending']).default('pending'),
  duration: z.number().default(0),
  error: z.string().optional(),
  steps: z.array(z.string()).default([]),
})

const testSuiteSchema = z.object({
  name: z.string(),
  tests: z.array(testCaseSchema).default([]),
  lastRun: z.string().optional(),
  status: z.enum(['passed', 'failed', 'partial', 'pending']).default('pending'),
  tags: z.array(z.string()).default([]),
})

const testRunSchema = z.object({
  runNumber: z.number(),
  date: z.string(),
  duration: z.number(),
  passed: z.number().default(0),
  failed: z.number().default(0),
  skipped: z.number().default(0),
  trigger: z.enum(['manual', 'ci', 'scheduled']).default('manual'),
  status: z.enum(['passed', 'failed', 'partial']),
  suiteId: z.string().optional(),
})

const coverageCategorySchema = z.object({
  name: z.string(),
  percentage: z.number(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const testingRouter = router({
  /* ---------- list test suites ------------------------------------ */
  listSuites: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'test_suite'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.updatedAt))
    }),

  /* ---------- get suite ------------------------------------------- */
  getSuite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Test suite not found')
      return row
    }),

  /* ---------- create suite ---------------------------------------- */
  createSuite: protectedProcedure
    .input(z.object({ productId: z.string(), label: z.string(), suite: testSuiteSchema }))
    .mutation(async ({ ctx, input }) => {
      const data = {
        ...input.suite,
        tests: JSON.stringify(input.suite.tests),
        tags: JSON.stringify(input.suite.tags),
      } as Record<string, unknown>

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'test_suite',
          label: input.label,
          data,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('testing.suite.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.label, testCount: input.suite.tests.length, userId: ctx.session.userId },
      })
      return { id: node!.id }
    }),

  /* ---------- update suite ---------------------------------------- */
  updateSuite: protectedProcedure
    .input(z.object({ id: z.string(), label: z.string().optional(), suite: testSuiteSchema.partial().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Test suite not found')

      const currentData = existing.data ?? {}
      const merged = { ...currentData } as Record<string, unknown>
      if (input.suite?.name !== undefined) merged.name = input.suite.name
      if (input.suite?.status !== undefined) merged.status = input.suite.status
      if (input.suite?.lastRun !== undefined) merged.lastRun = input.suite.lastRun
      if (input.suite?.tests !== undefined) merged.tests = JSON.stringify(input.suite.tests)
      if (input.suite?.tags !== undefined) merged.tags = JSON.stringify(input.suite.tags)

      await ctx.db
        .update(graphNodes)
        .set({ label: input.label ?? existing.label, data: merged, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))
      return { id: input.id }
    }),

  /* ---------- delete suite ---------------------------------------- */
  deleteSuite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(eq(graphNodes.id, input.id))
      return { id: input.id }
    }),

  /* ---------- record test run ------------------------------------- */
  recordRun: protectedProcedure
    .input(z.object({ productId: z.string(), run: testRunSchema }))
    .mutation(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'test_run',
          label: `Run #${input.run.runNumber}`,
          data: input.run as unknown as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      if (input.run.suiteId) {
        await ctx.db.insert(graphEdges).values({
          productId: input.productId,
          sourceId: input.run.suiteId,
          targetId: node!.id,
          kind: 'has_run',
        })
      }

      ctx.eventBus.emit('testing.run.completed', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: {
          nodeId: node!.id,
          productId: input.productId,
          passed: input.run.passed,
          failed: input.run.failed,
          status: input.run.status,
          userId: ctx.session.userId,
        },
      })
      return { id: node!.id }
    }),

  /* ---------- list test runs -------------------------------------- */
  listRuns: protectedProcedure
    .input(z.object({ productId: z.string(), limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'test_run'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.createdAt))
        .limit(input.limit)
    }),

  /* ---------- save coverage --------------------------------------- */
  saveCoverage: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        overall: z.number(),
        categories: z.array(coverageCategorySchema).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'test_coverage'),
            isNull(graphNodes.deletedAt),
          ),
        )

      const data = { overall: input.overall, categories: JSON.stringify(input.categories) } as Record<string, unknown>

      if (existing) {
        await ctx.db
          .update(graphNodes)
          .set({ data, updatedAt: new Date() })
          .where(eq(graphNodes.id, existing.id))
        return { id: existing.id }
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'test_coverage',
          label: 'Test Coverage',
          data,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()
      return { id: node!.id }
    }),

  /* ---------- get coverage ---------------------------------------- */
  getCoverage: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'test_coverage'),
            isNull(graphNodes.deletedAt),
          ),
        )
      if (!row) return { overall: 0, categories: [] }
      return row.data
    }),

  /* ---------- generate tests (AI placeholder) --------------------- */
  generateTests: protectedProcedure
    .input(z.object({ productId: z.string(), targetNodeId: z.string(), prompt: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      ctx.eventBus.emit('ai.skill.invoked', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: {
          skillId: 'test-generate',
          skillName: 'Test Generation',
          input: { targetNodeId: input.targetNodeId, prompt: input.prompt },
          triggeredBy: 'user' as const,
        },
      })
      return { status: 'queued' as const, message: 'Test generation request queued' }
    }),
})
