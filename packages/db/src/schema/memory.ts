import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, pgEnum, customType } from 'drizzle-orm/pg-core'
import { products } from './products'
import { users } from './users'

// pgvector column type. Stored/compared as text; pgvector extension handles operators.
const vector = (name: string, config: { dimensions: number }) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${config.dimensions})`,
    toDriver: (v: number[]) => `[${v.join(',')}]`,
    fromDriver: (v: string) => (v.startsWith('[') ? JSON.parse(v) : v.split(',').map(Number)),
  })(name)

export const memoryAssetStatusEnum = pgEnum('memory_asset_status', [
  'queued',
  'parsing',
  'embedding',
  'ready',
  'failed',
])

export const memoryAssetKindEnum = pgEnum('memory_asset_kind', [
  'pdf',
  'docx',
  'md',
  'txt',
  'image',
  'other',
])

export const productMemoryAssets = pgTable('product_memory_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  kind: memoryAssetKindEnum('kind').notNull(),
  filename: text('filename').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  status: memoryAssetStatusEnum('status').default('queued').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const productMemoryChunks = pgTable('product_memory_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => productMemoryAssets.id, { onDelete: 'cascade' }),
  ordinal: integer('ordinal').notNull(),
  text: text('text').notNull(),
  tokenCount: integer('token_count').notNull(),
  sourcePage: integer('source_page'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const productMemoryEmbeddings = pgTable('product_memory_embeddings', {
  chunkId: uuid('chunk_id')
    .primaryKey()
    .references(() => productMemoryChunks.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
})
