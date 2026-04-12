import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const templateBundles = pgTable('template_bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  tags: text('tags').array(),
  bundle: jsonb('bundle').$type<Record<string, unknown>>().notNull(),
  thumbnail: text('thumbnail'),
  isPublic: boolean('is_public').default(false).notNull(),
  isBuiltIn: boolean('is_built_in').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
