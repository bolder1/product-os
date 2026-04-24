import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { products } from './products'
import { users } from './users'

export type DecisionStatus = 'proposed' | 'decided' | 'revisited' | 'superseded'

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  rationale: text('rationale').notNull().default(''),
  /** JSON: Array<{ option: string; proscons: string }> */
  alternatives: jsonb('alternatives').$type<Array<{ option: string; proscons: string }>>().default([]),
  status: text('status').$type<DecisionStatus>().notNull().default('proposed'),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  supersededBy: uuid('superseded_by'),
  studio: text('studio').notNull().default('operate'),
  tags: jsonb('tags').$type<string[]>().default([]),
  /** JSON: Array<{ id: string; type: string; label: string }> */
  relatedEntities: jsonb('related_entities')
    .$type<Array<{ id: string; type: string; label: string }>>()
    .default([]),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
