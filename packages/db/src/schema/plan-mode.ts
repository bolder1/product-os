import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { products } from './products'
import { users } from './users'

export const planSessionStatusEnum = pgEnum('plan_session_status', [
  'in_progress',
  'finalized',
  'abandoned',
])

export const planSessions = pgTable('plan_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id),
  status: planSessionStatusEnum('status').default('in_progress').notNull(),
  currentStep: text('current_step').default('memory').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const planAnswers = pgTable('plan_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => planSessions.id, { onDelete: 'cascade' }),
  questionKey: text('question_key').notNull(),
  answer: jsonb('answer').$type<unknown>().notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
})

export const planDerivedArtifacts = pgTable('plan_derived_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => planSessions.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'brand' | 'voice' | 'features' | 'tasks' | 'roadmap' | ...
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
