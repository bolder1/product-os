import { z } from 'zod'
import { sql as rawSql } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/**
 * Lightweight graph-snapshot store backed by a single `graph_snapshots` table.
 * The table is created lazily here (idempotent DDL) to avoid a separate migration
 * commit; formal Drizzle schema can be added later.
 */
async function ensureTable() {
  await rawSql`
    CREATE TABLE IF NOT EXISTS graph_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL,
      taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      reason TEXT,
      payload JSONB NOT NULL
    )
  `
  await rawSql`CREATE INDEX IF NOT EXISTS graph_snapshots_product_taken_idx ON graph_snapshots (product_id, taken_at DESC)`
}

export const graphSnapshotRouter = router({
  take: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        reason: z.string().optional(),
        payload: z.object({
          nodes: z.array(z.record(z.unknown())),
          edges: z.array(z.record(z.unknown())),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      await ensureTable()
      const [row] = await rawSql<{ id: string; taken_at: Date }[]>`
        INSERT INTO graph_snapshots (product_id, reason, payload)
        VALUES (${input.productId}, ${input.reason ?? null}, ${rawSql.json(input.payload as any)})
        RETURNING id, taken_at
      `
      return row
    }),

  list: protectedProcedure
    .input(z.object({ productId: z.string().uuid(), limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      await ensureTable()
      return rawSql`
        SELECT id, taken_at, reason
        FROM graph_snapshots
        WHERE product_id = ${input.productId}
        ORDER BY taken_at DESC
        LIMIT ${input.limit}
      `
    }),

  get: protectedProcedure
    .input(z.object({ snapshotId: z.string().uuid() }))
    .query(async ({ input }) => {
      await ensureTable()
      const [row] = await rawSql`SELECT * FROM graph_snapshots WHERE id = ${input.snapshotId}`
      return row ?? null
    }),
})
