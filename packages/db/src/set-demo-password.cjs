// Sets the hashed password for the demo user using the same algorithm as password.ts
const crypto = require('crypto')
const DB_URL = 'postgresql://postgres:postgres@localhost:5433/product_os'

function hashPassword(plain) {
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = crypto.scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt:${salt}:${hash.toString('hex')}`
}

async function run() {
  const postgres = require(require.resolve('postgres'))
  const sql = postgres(DB_URL)
  try {
    const hash = hashPassword('demo123')
    const result = await sql`
      UPDATE users SET password_hash = ${hash}
      WHERE email = 'demo@productos.dev'
      RETURNING id, email
    `
    if (result.length > 0) {
      console.log('✓ Demo user password set:', result[0].email)
    } else {
      console.log('⚠ Demo user not found — running seed instead')
    }
  } finally {
    await sql.end()
  }
}

run().catch(e => { console.error(e.message); process.exit(1) })
