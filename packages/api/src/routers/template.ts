import { z } from 'zod'
import { eq, and, or, ilike } from 'drizzle-orm'
import { templateBundles, graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'
import { getBuiltInTemplates, getTemplateById, resolveVariables } from '@product-os/templates'

export const templateRouter = router({
  /**
   * Return the full built-in bundle manifests from the registry (no DB hit).
   * Used by the Templates Gallery to show rich previews and drive apply flow.
   */
  listBuiltInBundles: protectedProcedure.query(() => {
    return getBuiltInTemplates().map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      category: b.category,
      tags: b.tags,
      version: b.version,
      author: b.author,
      nodeCount: b.nodes.length,
      edgeCount: b.edges.length,
      variables: b.variables,
      nodeKinds: [...new Set(b.nodes.map((n) => n.kind))],
      nodeSample: b.nodes.slice(0, 8).map((n) => ({ kind: n.kind, label: n.label })),
    }))
  }),

  /**
   * Apply a built-in bundle (from the registry, not the DB) directly to a
   * product, with variable substitution. This is the primary happy-path for
   * new users: pick template → fill variables → nodes appear in graph.
   */
  applyBuiltIn: protectedProcedure
    .input(
      z.object({
        bundleId: z.string().min(1),
        productId: z.string().uuid(),
        variables: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bundle = getTemplateById(input.bundleId)
      if (!bundle) throw new Error(`Built-in template not found: ${input.bundleId}`)

      const resolved = resolveVariables(bundle, input.variables)
      const { applyTemplate } = await import('@product-os/templates')

      const createNode = async (node: {
        productId: string
        kind: string
        label: string
        data: Record<string, unknown>
      }): Promise<string> => {
        const [row] = await ctx.db
          .insert(graphNodes)
          .values({
            productId: node.productId,
            kind: node.kind as typeof graphNodes.$inferInsert.kind,
            label: node.label,
            data: node.data,
            createdBy: ctx.session.userId,
          })
          .returning({ id: graphNodes.id })
        return row!.id
      }

      const createEdge = async (edge: {
        productId: string
        sourceId: string
        targetId: string
        kind: string
      }): Promise<string> => {
        const [row] = await ctx.db
          .insert(graphEdges)
          .values({
            productId: edge.productId,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            kind: edge.kind as typeof graphEdges.$inferInsert.kind,
          })
          .returning({ id: graphEdges.id })
        return row!.id
      }

      const result = await applyTemplate(resolved, input.productId, createNode, createEdge)

      return {
        bundleId: input.bundleId,
        bundleName: bundle.name,
        nodesCreated: result.nodesCreated,
        edgesCreated: result.edgesCreated,
        nodeIdMap: Object.fromEntries(result.nodeIdMap),
      }
    }),

  listBuiltIn: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(templateBundles)
      .where(eq(templateBundles.isBuiltIn, true))
  }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        or(
          eq(templateBundles.isBuiltIn, true),
          eq(templateBundles.isPublic, true),
          eq(templateBundles.orgId, ctx.session.orgId),
        ),
        or(
          ilike(templateBundles.name, `%${input.query}%`),
          ilike(templateBundles.description, `%${input.query}%`),
        ),
      ]
      if (input.category) {
        conditions.push(eq(templateBundles.category, input.category))
      }
      return ctx.db
        .select()
        .from(templateBundles)
        .where(and(...conditions))
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(templateBundles)
        .where(eq(templateBundles.id, input.id))
        .limit(1)
      if (!template) {
        throw new Error('Template not found')
      }
      return template
    }),

  applyTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        productId: z.string().uuid(),
        options: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the template bundle
      const [template] = await ctx.db
        .select()
        .from(templateBundles)
        .where(eq(templateBundles.id, input.templateId))
        .limit(1)

      if (!template) {
        throw new Error('Template not found')
      }

      // Delegate to the templates package applier with DB callbacks
      const { applyTemplate, resolveVariables } = await import('@product-os/templates')

      // Resolve template variables from options
      const resolvedBundle = resolveVariables(template.bundle, input.options as Record<string, string>)

      const createNode = async (node: {
        productId: string
        kind: string
        label: string
        data: Record<string, unknown>
      }): Promise<string> => {
        const [row] = await ctx.db
          .insert(graphNodes)
          .values({
            productId: node.productId,
            kind: node.kind as typeof graphNodes.$inferInsert.kind,
            label: node.label,
            data: node.data,
            createdBy: ctx.session.userId,
          })
          .returning({ id: graphNodes.id })
        return row.id
      }

      const createEdge = async (edge: {
        productId: string
        sourceId: string
        targetId: string
        kind: string
      }): Promise<string> => {
        const [row] = await ctx.db
          .insert(graphEdges)
          .values({
            productId: edge.productId,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            kind: edge.kind as typeof graphEdges.$inferInsert.kind,
          })
          .returning({ id: graphEdges.id })
        return row.id
      }

      const result = await applyTemplate(resolvedBundle, input.productId, createNode, createEdge)

      return {
        nodesCreated: result.nodesCreated,
        edgesCreated: result.edgesCreated,
        nodeIdMap: Object.fromEntries(result.nodeIdMap),
      }
    }),
})
