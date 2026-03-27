import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { products } from './products.js'
import { users } from './users.js'

export const branchStatusEnum = pgEnum('branch_status', ['active', 'merged', 'archived'])

export const versions = pgTable('versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  parentId: uuid('parent_id'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  baseVersionId: uuid('base_version_id').references(() => versions.id),
  status: branchStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
