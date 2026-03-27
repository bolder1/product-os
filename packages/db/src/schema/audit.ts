import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { products } from './products.js'
import { users } from './users.js'

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  diff: jsonb('diff').$type<Record<string, unknown>>(),
  studioOrigin: text('studio_origin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const aiSkillHistory = pgTable('ai_skill_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  skill: text('skill').notNull(),
  inputContext: jsonb('input_context').$type<Record<string, unknown>>(),
  output: jsonb('output').$type<Record<string, unknown>>(),
  model: text('model'),
  tokensUsed: integer('tokens_used'),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  studioOrigin: text('studio_origin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
