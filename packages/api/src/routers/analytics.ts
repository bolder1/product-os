import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const metricDefSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.number(),
  sparkline: z.array(z.number()).default([]),
  unit: z.string().optional(),
})

const dailyTrafficSchema = z.object({
  date: z.string(),
  pageViews: z.number(),
  uniqueVisitors: z.number(),
})

const funnelStepSchema = z.object({
  name: z.string(),
  percentage: z.number(),
  dropOff: z.number(),
})

const topPageSchema = z.object({
  name: z.string(),
  path: z.string(),
  views: z.number(),
  uniqueVisitors: z.number(),
  avgTime: z.string(),
  bounceRate: z.number(),
  sparkline: z.array(z.number()).default([]),
})

const insightSchema = z.object({
  text: z.string(),
  severity: z.enum(['info', 'warning', 'success', 'critical']),
  action: z.string(),
  dismissed: z.boolean().default(false),
})

const dashboardSchema = z.object({
  metrics: z.array(metricDefSchema).default([]),
  dailyTraffic: z.array(dailyTrafficSchema).default([]),
  funnel: z.array(funnelStepSchema).default([]),
  topPages: z.array(topPageSchema).default([]),
  insights: z.array(insightSchema).default([]),
  dateRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const analyticsRouter = router({
  /* ---------- get dashboard --------------------------------------- */
  getDashboard: protectedProcedure
    .input(z.object({ productId: z.string(), dateRange: z.enum(['7d', '30d', '90d', '1y']).default('30d') }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'analytics_dashboard'),
            isNull(graphNodes.deletedAt),
          ),
        )
      if (!row) return null
      return row
    }),

  /* ---------- save dashboard config ------------------------------- */
  saveDashboard: protectedProcedure
    .input(z.object({ productId: z.string(), dashboard: dashboardSchema }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'analytics_dashboard'),
            isNull(graphNodes.deletedAt),
          ),
        )

      const serialized = {
        ...input.dashboard,
        metrics: JSON.stringify(input.dashboard.metrics),
        dailyTraffic: JSON.stringify(input.dashboard.dailyTraffic),
        funnel: JSON.stringify(input.dashboard.funnel),
        topPages: JSON.stringify(input.dashboard.topPages),
        insights: JSON.stringify(input.dashboard.insights),
      } as Record<string, unknown>

      if (existing) {
        await ctx.db
          .update(graphNodes)
          .set({ data: serialized, updatedAt: new Date() })
          .where(eq(graphNodes.id, existing.id))
        return { id: existing.id }
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'analytics_dashboard',
          label: 'Analytics Dashboard',
          data: serialized,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()
      return { id: node!.id }
    }),

  /* ---------- list tracked events --------------------------------- */
  listEvents: protectedProcedure
    .input(z.object({ productId: z.string(), limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'analytics_event'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.createdAt))
        .limit(input.limit)
    }),

  /* ---------- track event ----------------------------------------- */
  trackEvent: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        eventName: z.string(),
        properties: z.record(z.string(), z.unknown()).default({}),
        sessionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'analytics_event',
          label: input.eventName,
          data: { properties: input.properties, sessionId: input.sessionId, timestamp: new Date().toISOString() } as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()
      return { id: node!.id }
    }),

  /* ---------- create / update insight ----------------------------- */
  upsertInsight: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        id: z.string().optional(),
        insight: insightSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await ctx.db
          .update(graphNodes)
          .set({ data: input.insight as unknown as Record<string, unknown>, updatedAt: new Date() })
          .where(eq(graphNodes.id, input.id))
        return { id: input.id }
      }
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'insight',
          label: input.insight.text.slice(0, 80),
          data: input.insight as unknown as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('analytics.insight.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, severity: input.insight.severity, userId: ctx.session.userId },
      })
      return { id: node!.id }
    }),

  /* ---------- dismiss insight ------------------------------------- */
  dismissInsight: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Insight not found')

      const data = row.data ?? {}
      await ctx.db
        .update(graphNodes)
        .set({ data: { ...data, dismissed: true } as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.id))
      return { id: input.id }
    }),

  /* ---------- list experiments ------------------------------------ */
  listExperiments: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'experiment'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.updatedAt))
    }),

  /* ---------- create experiment ----------------------------------- */
  createExperiment: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        label: z.string(),
        hypothesis: z.string(),
        metric: z.string(),
        variants: z.array(z.object({ name: z.string(), allocation: z.number() })).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'experiment',
          label: input.label,
          data: {
            hypothesis: input.hypothesis,
            metric: input.metric,
            variants: JSON.stringify(input.variants),
            status: 'draft',
          } as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('analytics.experiment.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.label, userId: ctx.session.userId },
      })
      return { id: node!.id }
    }),
})
