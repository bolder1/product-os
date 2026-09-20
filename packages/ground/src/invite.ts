import { createHash, timingSafeEqual } from 'node:crypto'

export type SignupMode =
  /** An invite code is configured and required. */
  | { kind: 'invite-required' }
  /** No code configured, and this is `next dev` — open for local convenience. */
  | { kind: 'open' }
  /** No code configured in production. Fail closed rather than wide open. */
  | { kind: 'closed' }

/**
 * Decides whether signup is allowed, and on what terms.
 *
 * The important case is the last one. Forgetting to set GROUND_INVITE_CODE is
 * exactly the mistake this gate exists to prevent, so an unconfigured
 * production build refuses signups rather than silently accepting anyone who
 * finds the URL.
 *
 * Note that `next start` sets NODE_ENV=production itself, so only `next dev`
 * takes the open path — a production build is never open by accident.
 */
export function signupMode(env: Record<string, string | undefined> = process.env): SignupMode {
  const code = env.GROUND_INVITE_CODE?.trim()
  if (code) return { kind: 'invite-required' }
  return env.NODE_ENV === 'production' ? { kind: 'closed' } : { kind: 'open' }
}

/**
 * Compares a submitted code against the configured one in constant time.
 *
 * Both sides are hashed first so the comparison length is fixed — comparing
 * the raw strings would leak the code's length through timing.
 */
export function inviteCodeMatches(
  submitted: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const expected = env.GROUND_INVITE_CODE?.trim()
  if (!expected) return false

  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest()
  return timingSafeEqual(digest(submitted.trim()), digest(expected))
}
