export * from './ingest'
export * from './embed'
export * from './store'
export * from './retrieve'

import type postgres from 'postgres'
import { ingestFile, type IngestKind } from './ingest'
import { embed } from './embed'
import { createAsset, setAssetStatus, insertChunks, insertEmbeddings } from './store'

/**
 * End-to-end: take a file buffer, create an asset row, chunk, embed, persist.
 * Returns the asset id. Errors are captured in the asset's `status='failed'` + `error`.
 */
export async function processUpload(
  sql: postgres.Sql,
  args: {
    productId: string
    kind: IngestKind
    filename: string
    buffer: Buffer
    uploadedBy?: string
    tags?: string[]
  },
): Promise<string> {
  const deps = { sql }
  const assetId = await createAsset(deps, {
    productId: args.productId,
    kind: args.kind,
    filename: args.filename,
    size: args.buffer.length,
    uploadedBy: args.uploadedBy,
    tags: args.tags,
  })

  ;(async () => {
    try {
      await setAssetStatus(deps, assetId, 'parsing')
      const chunks = await ingestFile({ buffer: args.buffer, kind: args.kind, filename: args.filename })
      if (!chunks.length) {
        await setAssetStatus(deps, assetId, 'ready')
        return
      }
      const chunkIds = await insertChunks(deps, assetId, chunks)
      await setAssetStatus(deps, assetId, 'embedding')
      const vectors = await embed(chunks.map((c) => c.text))
      await insertEmbeddings(
        deps,
        chunkIds.map((id, i) => ({ chunkId: id, embedding: vectors[i] })),
      )
      await setAssetStatus(deps, assetId, 'ready')
    } catch (e) {
      await setAssetStatus(deps, assetId, 'failed', (e as Error).message)
    }
  })()

  return assetId
}
