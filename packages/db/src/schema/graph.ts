import { pgTable, uuid, text, timestamp, jsonb, integer, index, pgEnum } from 'drizzle-orm/pg-core'
import { products } from './products'
import { users } from './users'

export const graphNodeKindEnum = pgEnum('graph_node_kind', [
  'product',
  'plan',
  'template_bundle',
  'module',
  'feature',
  'journey',
  'page',
  'route',
  'screen',
  'workflow',
  'entity',
  'field',
  'component',
  'variant',
  'token',
  'asset',
  'task',
  'approval',
  'insight',
  'release',
  'connector_binding',
  'mcp_binding',
  'skill_action',
  'computer_action',
])

export const graphEdgeKindEnum = pgEnum('graph_edge_kind', [
  'contains',
  'depends_on',
  'references',
  'implements',
  'inherits',
  'triggers',
  'routes_to',
  'uses_token',
  'uses_component',
  'assigned_to',
  'approves',
  'blocks',
])

export const graphNodes = pgTable(
  'graph_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    kind: graphNodeKindEnum('kind').notNull(),
    label: text('label').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().default({}).notNull(),
    position: jsonb('position').$type<{ x: number; y: number }>(),
    createdBy: uuid('created_by').references(() => users.id),
    version: integer('version').default(1).notNull(),
    branchId: uuid('branch_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_graph_nodes_product_kind').on(table.productId, table.kind),
    index('idx_graph_nodes_product_branch').on(table.productId, table.branchId),
  ],
)

export const graphEdges = pgTable(
  'graph_edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => graphNodes.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id')
      .notNull()
      .references(() => graphNodes.id, { onDelete: 'cascade' }),
    kind: graphEdgeKindEnum('kind').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_graph_edges_product').on(table.productId),
    index('idx_graph_edges_source').on(table.sourceId),
    index('idx_graph_edges_target').on(table.targetId),
    index('idx_graph_edges_source_kind').on(table.sourceId, table.kind),
  ],
)
