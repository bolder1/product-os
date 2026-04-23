import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEYLEN = 64
const OPTS = { N: 16384, r: 8, p: 1 }

export function hashPassword(plain: string): string {
  const salt = randomBytes(32).toString('hex')
  const hash = scryptSync(plain, salt, KEYLEN, OPTS)
  return `scrypt:${salt}:${hash.toString('hex')}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = parts[1] as string
  const hashHex = parts[2] as string
  const storedHash = Buffer.from(hashHex, 'hex')
  const derived = scryptSync(plain, salt, KEYLEN, OPTS)
  if (derived.length !== storedHash.length) return false
  return timingSafeEqual(derived, storedHash)
}
