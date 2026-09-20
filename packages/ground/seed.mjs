#!/usr/bin/env node
/**
 * Seeds a Ground workspace with real example context.
 *
 *   DATABASE_URL=postgresql://... node packages/ground/seed.mjs
 *
 * Idempotent: re-running replaces the demo account rather than duplicating it.
 * Never run this against a database holding real accounts — it deletes the
 * demo user, and cascades take its workspace and entries with it.
 */
import { randomBytes, scryptSync } from 'node:crypto'
import postgres from 'postgres'

const DEMO_EMAIL = 'demo@ground.local'
const DEMO_PASSWORD = 'ground-demo-1234'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

function hashPassword(plain) {
  const salt = randomBytes(32).toString('hex')
  const hash = scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')
  return `scrypt:${salt}:${hash}`
}

const sql = postgres(connectionString, { prepare: false })

// Ages are relative so the seed always demonstrates both states: one entry is
// deliberately older than the 90-day threshold and shows up as drifted.
const ENTRIES = [
  {
    kind: 'decision',
    title: 'Billing retries cap at three attempts',
    body: 'Applies to subscription renewals only, not one-off charges.',
    fields: {
      chose: 'Three retries with exponential backoff',
      rejected: 'Unlimited retries, five retries',
      because: 'Card networks penalise repeated declines',
    },
    ageDays: 94,
  },
  {
    kind: 'constraint',
    title: 'No PII in application logs',
    fields: {
      rule: 'Never log email, card or address fields',
      because: 'SOC 2 commitment to customers',
    },
    ageDays: 3,
  },
  {
    kind: 'convention',
    title: 'Server actions, not API routes',
    fields: {
      rule: 'Mutations go through server actions',
      example: 'apps/web/app/actions/entries.ts',
    },
    ageDays: 1,
  },
  {
    kind: 'nongoal',
    title: 'No team collaboration yet',
    fields: {
      notDoing: 'Shared workspaces, invitations, roles',
      because: 'Single-player has to be worth using first',
    },
    ageDays: 12,
  },
]

try {
  await sql.begin(async (tx) => {
    // Cascades remove the workspace and its entries.
    await tx`delete from users where email = ${DEMO_EMAIL}`

    const [user] = await tx`
      insert into users (email, name, password_hash)
      values (${DEMO_EMAIL}, 'Demo', ${hashPassword(DEMO_PASSWORD)})
      returning id
    `

    const mcpToken = `gnd_${randomBytes(24).toString('base64url')}`
    const [workspace] = await tx`
      insert into workspaces (owner_id, name, slug, mcp_token)
      values (${user.id}, 'Acme Billing', ${`acme-billing-${randomBytes(3).toString('hex')}`}, ${mcpToken})
      returning id, name
    `

    for (const entry of ENTRIES) {
      await tx`
        insert into entries (workspace_id, kind, title, body, fields, last_confirmed_at)
        values (
          ${workspace.id},
          ${entry.kind},
          ${entry.title},
          ${entry.body ?? ''},
          ${tx.json(entry.fields)},
          now() - ${`${entry.ageDays} days`}::interval
        )
      `
    }

    console.log(`Seeded "${workspace.name}" with ${ENTRIES.length} entries.`)
    console.log(`  Sign in:   ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
    console.log(`  MCP token: ${mcpToken}`)
    console.log('One entry is older than the staleness threshold, so drift is visible.')
  })
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
