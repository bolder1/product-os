// CommonJS migration — runs with plain node, no tsx needed
const { execSync } = require('child_process')

// Use pg client via psql docker exec (most reliable approach)
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/product_os'

async function run() {
  // Build postgres import path dynamically
  const postgresPath = require.resolve('postgres')
  const postgres = require(postgresPath)
  const sql = postgres(DB_URL)

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`
    console.log('✓ password_hash column added to users')
  } catch (e) {
    console.error('Migration error:', e.message)
  } finally {
    await sql.end()
  }
}

run()
