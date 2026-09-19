import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Drizzle = ReturnType<typeof drizzle<typeof schema>>

let instance: Drizzle | null = null

function connect(): Drizzle {
  if (instance) return instance

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and add your Postgres connection string.',
    )
  }

  // Supabase's pooler caps prepared statements; disabling them lets the pooled
  // connection string work without special-casing.
  instance = drizzle(postgres(connectionString, { prepare: false }), { schema })
  return instance
}

/**
 * Connects on first query rather than on import.
 *
 * Next collects page data at build time by importing every route, so a module
 * that throws on a missing DATABASE_URL would fail the build on machines that
 * have no database configured.
 */
export const db = new Proxy({} as Drizzle, {
  get(_target, prop, receiver) {
    return Reflect.get(connect() as object, prop, receiver)
  },
})

export type Db = Drizzle
