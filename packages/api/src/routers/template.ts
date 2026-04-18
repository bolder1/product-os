import { z } from 'zod'
import { eq, and, or, ilike } from 'drizzle-orm'
import { templateBundles, graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'
import { getBuiltInTemplates, getTemplateById, resolveVariables } from '@product-os/templates'

// ── Conflict resolution options ──────────────────────────────────────────────
export const conflictResolutionSchema = z.object({
  templateNodeId: z.string(),
  resolution: z.enum(['skip', 'rename', 'overwrite']),
})
export type ConflictResolution = z.infer<typeof conflictResolutionSchema>

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

  /**
   * Preview conflicts between a built-in bundle and the product's existing
   * graph nodes. Returns a list of conflicts (same kind + label) so the UI
   * can ask the user how to resolve each one before applying.
   */
  previewConflicts: protectedProcedure
    .input(
      z.object({
        bundleId: z.string().min(1),
        productId: z.string().uuid(),
        variables: z.record(z.unknown()).default({}),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bundle = getTemplateById(input.bundleId)
      if (!bundle) throw new Error(`Template not found: ${input.bundleId}`)

      const resolved = resolveVariables(bundle, input.variables)

      // Fetch existing nodes for this product
      const existing = await ctx.db
        .select({ kind: graphNodes.kind, label: graphNodes.label, id: graphNodes.id })
        .from(graphNodes)
        .where(eq(graphNodes.productId, input.productId))

      const existingIndex = new Map(
        existing.map((n) => [`${n.kind}::${n.label.toLowerCase()}`, n]),
      )

      const conflicts: Array<{
        templateNodeId: string
        kind: string
        label: string
        existingNodeId: string
        existingLabel: string
      }> = []

      for (const node of resolved.nodes) {
        const key = `${node.kind}::${node.label.toLowerCase()}`
        const match = existingIndex.get(key)
        if (match) {
          conflicts.push({
            templateNodeId: node.templateId,
            kind: node.kind,
            label: node.label,
            existingNodeId: match.id,
            existingLabel: match.label,
          })
        }
      }

      return {
        bundleName: bundle.name,
        totalNodes: resolved.nodes.length,
        newNodes: resolved.nodes.length - conflicts.length,
        conflicts,
      }
    }),

  /**
   * Use AI to suggest variable overrides for a template given a remix prompt.
   * e.g. "Make this a fintech app for enterprise teams"
   */
  remixWithAI: protectedProcedure
    .input(
      z.object({
        bundleId: z.string().min(1),
        productId: z.string().uuid(),
        prompt: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bundle = getTemplateById(input.bundleId)
      if (!bundle) throw new Error(`Template not found: ${input.bundleId}`)

      const { invokeSkill } = await import('@product-os/ai')

      const result = await invokeSkill({
        skill: 'suggest',
        productId: input.productId,
        prompt: `You are remixing a product template called "${bundle.name}".
Template description: ${bundle.description}
Template variables: ${JSON.stringify(bundle.variables, null, 2)}

User remix request: "${input.prompt}"

Return a JSON object with suggested values for each variable key. Only include variables you want to change. Example: { "product_name": "FinTrack Pro", "primary_color": "#10B981" }`,
        context: { skill: 'template_remix', bundleId: input.bundleId },
        userId: ctx.session.userId,
      })

      // Try to extract JSON from the AI response
      let suggestions: Record<string, unknown> = {}
      try {
        const text = typeof result.text === 'string' ? result.text : JSON.stringify(result)
        const match = text.match(/\{[\s\S]*\}/)
        if (match) suggestions = JSON.parse(match[0])
      } catch { /* return empty suggestions on parse failure */ }

      return { suggestions, rawResponse: typeof result.text === 'string' ? result.text : '' }
    }),

  /**
   * Save the current product graph as a custom template bundle in the DB.
   * The user names it and picks a category; nodes/edges are serialised from
   * the live graph.
   */
  saveAsBundle: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1).max(120),
        description: z.string().max(500).default(''),
        category: z.enum(['saas', 'mobile', 'ecommerce', 'marketing', 'design_system', 'internal_ops', 'custom']).default('custom'),
        tags: z.array(z.string()).default([]),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const nodes = await ctx.db
        .select()
        .from(graphNodes)
        .where(eq(graphNodes.productId, input.productId))

      const edges = await ctx.db
        .select()
        .from(graphEdges)
        .where(eq(graphEdges.productId, input.productId))

      // Serialise into the bundle JSON format (templateId = original DB id)
      const bundleNodes = nodes.map((n) => ({
        templateId: n.id,
        kind: n.kind,
        label: n.label,
        data: n.data ?? {},
      }))

      const bundleEdges = edges
        .filter((e) =>
          nodes.some((n) => n.id === e.sourceId) &&
          nodes.some((n) => n.id === e.targetId),
        )
        .map((e) => ({
          sourceTemplateId: e.sourceId,
          targetTemplateId: e.targetId,
          kind: e.kind,
        }))

      const bundle = {
        id: `custom_${Date.now()}`,
        name: input.name,
        description: input.description,
        category: input.category,
        tags: input.tags,
        variables: [],
        nodes: bundleNodes,
        edges: bundleEdges,
        version: '1.0.0',
        author: ctx.session.userId,
      }

      const [row] = await ctx.db
        .insert(templateBundles)
        .values({
          orgId: ctx.session.orgId,
          name: input.name,
          description: input.description,
          category: input.category,
          tags: input.tags,
          bundle: bundle as Record<string, unknown>,
          isPublic: input.isPublic,
          isBuiltIn: false,
          createdBy: ctx.session.userId,
        })
        .returning({ id: templateBundles.id })

      return { id: row!.id, nodeCount: bundleNodes.length, edgeCount: bundleEdges.length }
    }),
})
