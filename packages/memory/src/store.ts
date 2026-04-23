/**
 * Product Memory — DB store operations
 */
import type postgres from 'postgres'
import type { IngestChunk, IngestKind } from './ingest'

export interface StoreDeps {
  sql: postgres.Sql
}

export async function createAsset(
  deps: StoreDeps,
  args: { productId: string; kind: IngestKind; filename: string; size: number; uploadedBy?: string; tags?: string[] },
): Promise<string> {
  const [row] = await deps.sql<{ id: string }[]>`
    INSERT INTO product_memory_assets (product_id, kind, filename, size, uploaded_by, tags, status)
    VALUES (${args.productId}, ${args.kind}, ${args.filename}, ${args.size},
            ${args.uploadedBy ?? null}, ${deps.sql.json(args.tags ?? [])}, 'queued')
    RETURNING id
  `
  return row.id
}

export async function setAssetStatus(
  deps: StoreDeps,
  assetId: string,
  status: 'queued' | 'parsing' | 'embedding' | 'ready' | 'failed',
  error?: string,
): Promise<void> {
  await deps.sql`
    UPDATE product_memory_assets
    SET status = ${status}, error = ${error ?? null}
    WHERE id = ${assetId}
  `
}

export async function insertChunks(
  deps: StoreDeps,
  assetId: string,
  chunks: IngestChunk[],
): Promise<string[]> {
  if (!chunks.length) return []
  const rows = await deps.sql<{ id: string }[]>`
    INSERT INTO product_memory_chunks ${deps.sql(
      chunks.map((c) => ({
        asset_id: assetId,
        ordinal: c.ordinal,
        text: c.text,
        token_count: c.tokenCount,
        source_page: c.sourcePage ?? null,
      })),
    )}
    RETURNING id
  `
  return rows.map((r) => r.id)
}

export async function insertEmbeddings(
  deps: StoreDeps,
  rows: Array<{ chunkId: string; embedding: number[] }>,
): Promise<void> {
  if (!rows.length) return
  for (const r of rows) {
    const vec = `[${r.embedding.join(',')}]`
    await deps.sql`
      INSERT INTO product_memory_embeddings (chunk_id, embedding)
      VALUES (${r.chunkId}, ${vec}::vector)
      ON CONFLICT (chunk_id) DO UPDATE SET embedding = EXCLUDED.embedding
    `
  }
}

export async function listAssets(deps: StoreDeps, productId: string) {
  return deps.sql`
    SELECT id, kind, filename, size, status, tags, uploaded_by, error, created_at
    FROM product_memory_assets
    WHERE product_id = ${productId}
    ORDER BY created_at DESC
  `
}

export async function deleteAsset(deps: StoreDeps, assetId: string) {
  await deps.sql`DELETE FROM product_memory_assets WHERE id = ${assetId}`
}
