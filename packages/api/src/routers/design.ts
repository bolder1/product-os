import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas for design elements and screens                        */
/* ------------------------------------------------------------------ */
const elementStyleSchema = z.record(z.string(), z.unknown()).optional()

const elementDefSchema: z.ZodType<ElementDef> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    style: elementStyleSchema,
    content: z.string().optional(),
    children: z.array(elementDefSchema).optional(),
    componentRef: z.string().uuid().optional(), // linked component node ID
    locked: z.boolean().optional(),
    visible: z.boolean().optional(),
  }),
)

interface ElementDef {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  style?: Record<string, unknown>
  content?: string
  children?: ElementDef[]
  componentRef?: string
  locked?: boolean
  visible?: boolean
}

const screenDataSchema = z.object({
  width: z.number().default(1440),
  height: z.number().default(900),
  category: z.enum(['mobile', 'tablet', 'desktop']).default('desktop'),
  elements: z.array(elementDefSchema).default([]),
  gridSettings: z
    .object({
      columns: z.number().default(12),
      gutter: z.number().default(16),
      margin: z.number().default(24),
      visible: z.boolean().default(false),
    })
    .optional(),
  autoLayout: z
    .object({
      direction: z.enum(['horizontal', 'vertical']).default('vertical'),
      gap: z.number().default(8),
      padding: z.number().default(16),
      alignment: z.enum(['start', 'center', 'end', 'stretch']).default('start'),
    })
    .optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */
export const designRouter = router({
  /* ---------- List screens for a product ----------------------------- */
  listScreens: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        category: z.enum(['mobile', 'tablet', 'desktop']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(graphNodes.productId, input.productId),
        eq(graphNodes.kind, 'screen'),
        isNull(graphNodes.deletedAt),
      ]
      const rows = await ctx.db.select().from(graphNodes).where(and(...conditions)).orderBy(desc(graphNodes.updatedAt))

      if (input.category) {
        return rows.filter((r) => (r.data as Record<string, unknown>)?.category === input.category)
      }
      return rows
    }),

  /* ---------- Get single screen ------------------------------------- */
  getScreen: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'screen'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Screen not found')
      return node
    }),

  /* ---------- Create screen ----------------------------------------- */
  createScreen: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: screenDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'screen',
          label: input.name,
          data: {
            ...input.data,
            elements: JSON.stringify(input.data.elements),
          } as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('design.screen.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.name, category: input.data.category, userId: ctx.session.userId },
      }).catch(() => {})

      return node!
    }),

  /* ---------- Update screen ----------------------------------------- */
  updateScreen: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: screenDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'screen'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Screen not found')

      const currentData = current.data as Record<string, unknown>
      const merged: Record<string, unknown> = { ...currentData }

      if (input.data.width !== undefined) merged.width = input.data.width
      if (input.data.height !== undefined) merged.height = input.data.height
      if (input.data.category !== undefined) merged.category = input.data.category
      if (input.data.elements !== undefined) merged.elements = JSON.stringify(input.data.elements)
      if (input.data.gridSettings !== undefined) merged.gridSettings = input.data.gridSettings
      if (input.data.autoLayout !== undefined) merged.autoLayout = input.data.autoLayout

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

      ctx.eventBus.emit('design.screen.updated', {
        productId: updated!.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: updated!.id, productId: updated!.productId, userId: ctx.session.userId },
      }).catch(() => {})

      return updated!
    }),

  /* ---------- Delete screen ----------------------------------------- */
  deleteScreen: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'screen')))
        .returning()
      if (!deleted) throw new Error('Screen not found')

      ctx.eventBus.emit('design.screen.deleted', {
        productId: deleted.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: deleted.productId, userId: ctx.session.userId },
      }).catch(() => {})

      return { deleted: true }
    }),

  /* ---------- Place component instance on screen -------------------- */
  placeComponent: protectedProcedure
    .input(
      z.object({
        screenId: z.string().uuid(),
        componentId: z.string().uuid(),
        x: z.number(),
        y: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify both screen and component exist
      const [screen] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.screenId), eq(graphNodes.kind, 'screen'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!screen) throw new Error('Screen not found')

      const [component] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.componentId), eq(graphNodes.kind, 'component'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!component) throw new Error('Component not found')

      // Add element to screen's elements array
      const screenData = screen.data as Record<string, unknown>
      const elementsRaw = screenData.elements
      const elements: ElementDef[] = (() => {
        try {
          return typeof elementsRaw === 'string' ? JSON.parse(elementsRaw) : (elementsRaw as ElementDef[]) ?? []
        } catch {
          return []
        }
      })()

      const newElement: ElementDef = {
        id: `el-${Date.now()}`,
        type: 'ComponentInstance',
        x: input.x,
        y: input.y,
        width: input.width ?? 200,
        height: input.height ?? 100,
        componentRef: input.componentId,
        content: component.label,
      }

      elements.push(newElement)

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...screenData, elements: JSON.stringify(elements) },
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.screenId))

      // Create uses_component edge if not exists
      const existingEdge = await ctx.db
        .select()
        .from(graphEdges)
        .where(
          and(
            eq(graphEdges.sourceId, input.screenId),
            eq(graphEdges.targetId, input.componentId),
            eq(graphEdges.kind, 'uses_component'),
          ),
        )
        .limit(1)

      if (existingEdge.length === 0) {
        await ctx.db.insert(graphEdges).values({
          productId: screen.productId,
          sourceId: input.screenId,
          targetId: input.componentId,
          kind: 'uses_component',
        })
      }

      ctx.eventBus.emit('design.component.placed', {
        productId: screen.productId,
        actorId: ctx.session.userId,
        payload: { screenId: input.screenId, componentId: input.componentId, componentLabel: component.label, userId: ctx.session.userId },
      }).catch(() => {})

      return newElement
    }),

  /* ---------- Auto-layout a container element ----------------------- */
  applyAutoLayout: protectedProcedure
    .input(
      z.object({
        screenId: z.string().uuid(),
        elementId: z.string(),
        direction: z.enum(['horizontal', 'vertical']),
        gap: z.number().default(8),
        padding: z.number().default(16),
        alignment: z.enum(['start', 'center', 'end', 'stretch']).default('start'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [screen] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.screenId), eq(graphNodes.kind, 'screen'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!screen) throw new Error('Screen not found')

      const screenData = screen.data as Record<string, unknown>
      const elements: ElementDef[] = (() => {
        try {
          const raw = screenData.elements
          return typeof raw === 'string' ? JSON.parse(raw) : (raw as ElementDef[]) ?? []
        } catch {
          return []
        }
      })()

      // Find the target element and its children
      function applyLayout(els: ElementDef[]): ElementDef[] {
        return els.map((el) => {
          if (el.id === input.elementId && el.children && el.children.length > 0) {
            let currentPos = input.padding
            const children = el.children.map((child) => {
              const updated = { ...child }
              if (input.direction === 'vertical') {
                updated.x = input.alignment === 'center' ? (el.width - child.width) / 2
                  : input.alignment === 'end' ? el.width - child.width - input.padding
                  : input.padding
                updated.y = currentPos
                currentPos += child.height + input.gap
              } else {
                updated.x = currentPos
                updated.y = input.alignment === 'center' ? (el.height - child.height) / 2
                  : input.alignment === 'end' ? el.height - child.height - input.padding
                  : input.padding
                currentPos += child.width + input.gap
              }
              return updated
            })
            return {
              ...el,
              children,
              style: {
                ...el.style,
                autoLayout: {
                  direction: input.direction,
                  gap: input.gap,
                  padding: input.padding,
                  alignment: input.alignment,
                },
              },
            }
          }
          if (el.children) return { ...el, children: applyLayout(el.children) }
          return el
        })
      }

      const updated = applyLayout(elements)

      await ctx.db
        .update(graphNodes)
        .set({
          data: { ...screenData, elements: JSON.stringify(updated) },
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.screenId))

      return { applied: true }
    }),
})
