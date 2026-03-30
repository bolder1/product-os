import { z } from 'zod'
import { eq, and, or, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

const nodeKindValues = [
  'product', 'plan', 'template_bundle', 'module', 'feature', 'journey',
  'page', 'route', 'screen', 'workflow', 'entity', 'field', 'component',
  'variant', 'token', 'asset', 'task', 'approval', 'insight', 'release',
  'connector_binding', 'mcp_binding', 'skill_action', 'computer_action',
] as const

const edgeKindValues = [
  'contains', 'depends_on', 'references', 'implements', 'inherits',
  'triggers', 'routes_to', 'uses_token', 'uses_component', 'assigned_to',
  'approves', 'blocks',
] as const

export const graphRouter = router({
  getNodes: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        kind: z.enum(nodeKindValues).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(graphNodes.productId, input.productId),
        isNull(graphNodes.deletedAt),
      ]
      if (input.kind) {
        conditions.push(eq(graphNodes.kind, input.kind))
      }
      return ctx.db.select().from(graphNodes).where(and(...conditions))
    }),

  getNode: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) {
        throw new Error('Node not found')
      }
      return node
    }),

  createNode: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        kind: z.enum(nodeKindValues),
        label: z.string().min(1),
        data: z.record(z.unknown()).default({}),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: input.kind,
          label: input.label,
          data: input.data,
          position: input.position,
          createdBy: ctx.session.userId,
        })
        .returning()
      return node
    }),

  updateNode: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1).optional(),
        data: z.record(z.unknown()).optional(),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const setClause: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.label !== undefined) setClause.label = updates.label
      if (updates.data !== undefined) setClause.data = updates.data
      if (updates.position !== undefined) setClause.position = updates.position

      const [node] = await ctx.db
        .update(graphNodes)
        .set(setClause)
        .where(and(eq(graphNodes.id, id), isNull(graphNodes.deletedAt)))
        .returning()
      if (!node) {
        throw new Error('Node not found')
      }
      return node
    }),

  deleteNode: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
        .returning()
      if (!node) {
        throw new Error('Node not found')
      }
      return node
    }),

  getEdges: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        sourceId: z.string().uuid().optional(),
        targetId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(graphEdges.productId, input.productId)]
      if (input.sourceId) {
        conditions.push(eq(graphEdges.sourceId, input.sourceId))
      }
      if (input.targetId) {
        conditions.push(eq(graphEdges.targetId, input.targetId))
      }
      return ctx.db.select().from(graphEdges).where(and(...conditions))
    }),

  createEdge: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        sourceId: z.string().uuid(),
        targetId: z.string().uuid(),
        kind: z.enum(edgeKindValues),
        data: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [edge] = await ctx.db
        .insert(graphEdges)
        .values({
          productId: input.productId,
          sourceId: input.sourceId,
          targetId: input.targetId,
          kind: input.kind,
          data: input.data,
        })
        .returning()
      return edge
    }),

  deleteEdge: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [edge] = await ctx.db
        .delete(graphEdges)
        .where(eq(graphEdges.id, input.id))
        .returning()
      if (!edge) {
        throw new Error('Edge not found')
      }
      return edge
    }),

  getNeighbors: protectedProcedure
    .input(z.object({ nodeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get all edges where the node is either source or target
      const edges = await ctx.db
        .select()
        .from(graphEdges)
        .where(
          or(
            eq(graphEdges.sourceId, input.nodeId),
            eq(graphEdges.targetId, input.nodeId),
          ),
        )

      // Collect neighbor node IDs
      const neighborIds = new Set<string>()
      for (const edge of edges) {
        if (edge.sourceId !== input.nodeId) neighborIds.add(edge.sourceId)
        if (edge.targetId !== input.nodeId) neighborIds.add(edge.targetId)
      }

      if (neighborIds.size === 0) return []

      // Fetch all neighbor nodes (not soft-deleted)
      const nodes = await ctx.db
        .select()
        .from(graphNodes)
        .where(isNull(graphNodes.deletedAt))

      return nodes.filter((n) => neighborIds.has(n.id))
    }),
})
