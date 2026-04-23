import { z } from 'zod'
import { sql as rawSql } from '@product-os/db'
import { processUpload, retrieve as retrieveMemory, listAssets, deleteAsset, type IngestKind } from '@product-os/memory'
import { router, protectedProcedure } from '../trpc'

const kindSchema = z.enum(['pdf', 'docx', 'md', 'txt', 'image', 'other']) satisfies z.ZodType<IngestKind>

export const memoryRouter = router({
  /**
   * Upload a base64-encoded file. Kicks off async parse + embed; returns assetId immediately.
   * (For larger files a direct-upload signed URL flow would be preferable — deferred.)
   */
  upload: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        kind: kindSchema,
        filename: z.string().min(1).max(512),
        contentBase64: z.string().min(1),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.contentBase64, 'base64')
      const assetId = await processUpload(rawSql, {
        productId: input.productId,
        kind: input.kind,
        filename: input.filename,
        buffer,
        uploadedBy: ctx.session.userId,
        tags: input.tags,
      })
      return { assetId }
    }),

  list: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ input }) => {
      return listAssets({ sql: rawSql }, input.productId)
    }),

  getStatus: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [row] = await rawSql<Array<{ status: string; error: string | null }>>`
        SELECT status, error FROM product_memory_assets WHERE id = ${input.assetId}
      `
      return row ?? null
    }),

  delete: protectedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await deleteAsset({ sql: rawSql }, input.assetId)
      return { ok: true }
    }),

  retrieve: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        query: z.string().min(1),
        k: z.number().min(1).max(20).default(6),
      }),
    )
    .query(async ({ input }) => {
      return retrieveMemory({ sql: rawSql }, input)
    }),
})
