/**
 * Product Memory — retrieval via pgvector cosine similarity.
 */
import type { StoreDeps } from './store'
import { embed } from './embed'

export interface RetrievedChunk {
  chunkId: string
  assetId: string
  filename: string
  ordinal: number
  text: string
  sourcePage: number | null
  score: number
}

export async function retrieve(
  deps: StoreDeps,
  args: { productId: string; query: string; k?: number },
): Promise<RetrievedChunk[]> {
  const k = args.k ?? 6
  const [qVec] = await embed([args.query])
  if (!qVec) return []
  const vec = `[${qVec.join(',')}]`

  const rows = await deps.sql<Array<{
    chunk_id: string
    asset_id: string
    filename: string
    ordinal: number
    text: string
    source_page: number | null
    score: number
  }>>`
    SELECT c.id AS chunk_id, a.id AS asset_id, a.filename, c.ordinal, c.text,
           c.source_page,
           1 - (e.embedding <=> ${vec}::vector) AS score
    FROM product_memory_embeddings e
    JOIN product_memory_chunks c ON c.id = e.chunk_id
    JOIN product_memory_assets a ON a.id = c.asset_id
    WHERE a.product_id = ${args.productId} AND a.status = 'ready'
    ORDER BY e.embedding <=> ${vec}::vector
    LIMIT ${k}
  `
  return rows.map((r) => ({
    chunkId: r.chunk_id,
    assetId: r.asset_id,
    filename: r.filename,
    ordinal: r.ordinal,
    text: r.text,
    sourcePage: r.source_page,
    score: r.score,
  }))
}
