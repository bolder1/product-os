import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const fileNodeSchema = z.object({
  path: z.string(),
  name: z.string(),
  language: z.enum(['tsx', 'ts', 'css', 'json', 'md', 'html', 'yaml', 'sql', 'graphql']),
  content: z.string(),
  folder: z.string(),
})

const codeModuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  files: z.array(fileNodeSchema).default([]),
  entryPoint: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

export const codeRouter = router({
  /* ---------- list modules ---------------------------------------- */
  list: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'module'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .orderBy(desc(graphNodes.updatedAt))
      return rows
    }),

  /* ---------- get single module ----------------------------------- */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!row) throw new Error('Code module not found')
      return row
    }),

  /* ---------- create module --------------------------------------- */
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        label: z.string(),
        module: codeModuleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        ...input.module,
        files: JSON.stringify(input.module.files),
      }
      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'module',
          label: input.label,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus.emit('code.module.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: node!.id, productId: input.productId, label: input.label, userId: ctx.session.userId },
      })
      return { id: node!.id }
    }),

  /* ---------- update module --------------------------------------- */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        module: codeModuleSchema.partial().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Code module not found')

      const currentData = existing.data ?? {}
      const patch = input.module ?? {}
      const merged = { ...currentData, ...patch } as Record<string, unknown>
      if (patch.files) merged.files = JSON.stringify(patch.files)

      await ctx.db
        .update(graphNodes)
        .set({
          label: input.label ?? existing.label,
          data: merged,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('code.module.updated', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: existing.productId, label: input.label ?? existing.label, userId: ctx.session.userId },
      })
      return { id: input.id }
    }),

  /* ---------- delete module --------------------------------------- */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), isNull(graphNodes.deletedAt)))
      if (!existing) throw new Error('Code module not found')

      await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(eq(graphNodes.id, input.id))

      ctx.eventBus.emit('code.module.deleted', {
        productId: existing.productId,
        actorId: ctx.session.userId,
        payload: { nodeId: input.id, productId: existing.productId, userId: ctx.session.userId },
      })
      return { id: input.id }
    }),

  /* ---------- add / update file in module ------------------------- */
  upsertFile: protectedProcedure
    .input(z.object({ moduleId: z.string(), file: fileNodeSchema }))
    .mutation(async ({ ctx, input }) => {
      const [mod] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.moduleId), isNull(graphNodes.deletedAt)))
      if (!mod) throw new Error('Code module not found')

      const data = mod.data ?? {}
      const rawFiles = typeof data.files === 'string' ? JSON.parse(data.files) : data.files ?? []
      const files: z.infer<typeof fileNodeSchema>[] = rawFiles
      const idx = files.findIndex((f) => f.path === input.file.path)
      if (idx >= 0) files[idx] = input.file
      else files.push(input.file)

      await ctx.db
        .update(graphNodes)
        .set({ data: { ...data, files: JSON.stringify(files) } as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.moduleId))

      return { path: input.file.path }
    }),

  /* ---------- remove file from module ----------------------------- */
  removeFile: protectedProcedure
    .input(z.object({ moduleId: z.string(), path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [mod] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.moduleId), isNull(graphNodes.deletedAt)))
      if (!mod) throw new Error('Code module not found')

      const data = mod.data ?? {}
      const rawFiles = typeof data.files === 'string' ? JSON.parse(data.files) : data.files ?? []
      const files = rawFiles.filter((f: { path: string }) => f.path !== input.path)

      await ctx.db
        .update(graphNodes)
        .set({ data: { ...data, files: JSON.stringify(files) } as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(graphNodes.id, input.moduleId))

      return { path: input.path }
    }),

  /* ---------- generate code (AI placeholder) ---------------------- */
  generate: protectedProcedure
    .input(z.object({ moduleId: z.string(), prompt: z.string(), targetPath: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      ctx.eventBus.emit('ai.skill.invoked', {
        productId: '',
        actorId: ctx.session.userId,
        payload: {
          skillId: 'code-generate',
          skillName: 'Code Generation',
          input: { moduleId: input.moduleId, prompt: input.prompt, targetPath: input.targetPath },
          triggeredBy: 'user' as const,
        },
      })
      return { status: 'queued' as const, message: 'Code generation request queued' }
    }),
})
