import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEYLEN = 64
const PARAMS = { N: 16384, r: 8, p: 1 } as const

export function hashPassword(plain: string): string {
  const salt = randomBytes(32).toString('hex')
  const hash = scryptSync(plain, salt, KEYLEN, PARAMS).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(plain, salt, KEYLEN, PARAMS)
  // Lengths must match before timingSafeEqual, which throws otherwise.
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function newToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** Workspace tokens are prefixed so they are recognisable in a config file. */
export function newMcpToken(): string {
  return `gnd_${newToken(24)}`
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'workspace'
}
