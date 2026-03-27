import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { organizations } from './organizations.js'
import { products } from './products.js'
import { graphNodes } from './graph.js'

export const connectorTypeEnum = pgEnum('connector_type', [
  'figma',
  'github',
  'jira',
  'slack',
  'google_analytics',
  'stripe',
  'notion',
  'custom',
])

export const syncStatusEnum = pgEnum('sync_status', [
  'idle',
  'syncing',
  'synced',
  'error',
])

export const connectorConfigs = pgTable('connector_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  type: connectorTypeEnum('type').notNull(),
  name: text('name').notNull(),
  credentialsEncrypted: text('credentials_encrypted'),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const connectorBindings = pgTable('connector_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  connectorId: uuid('connector_id')
    .notNull()
    .references(() => connectorConfigs.id, { onDelete: 'cascade' }),
  nodeId: uuid('node_id').references(() => graphNodes.id, { onDelete: 'set null' }),
  externalId: text('external_id'),
  externalType: text('external_type'),
  syncStatus: syncStatusEnum('sync_status').default('idle').notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncData: jsonb('sync_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const mcpServers = pgTable('mcp_servers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  capabilities: jsonb('capabilities').$type<Record<string, unknown>>().default({}),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
