'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  db,
  users,
  sessions,
  workspaces,
  hashPassword,
  verifyPassword,
  newToken,
  newMcpToken,
  slugify,
  signupMode,
  inviteCodeMatches,
} from '@ground/core/server'
import { setSessionCookie, clearSessionCookie, SESSION_COOKIE } from '../_lib/session'
import { cookies } from 'next/headers'

export interface FormState {
  error?: string
}

const credentials = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
})

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30

async function startSession(userId: string) {
  const token = newToken()
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
  })
  await setSessionCookie(token)
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  // Checked server-side on every attempt. The form hides the field when no
  // code is configured, but the form is not the gate — this is.
  const mode = signupMode()
  if (mode.kind === 'closed') {
    return { error: 'Signups are closed right now.' }
  }
  if (mode.kind === 'invite-required') {
    const submitted = String(formData.get('invite') ?? '')
    if (!submitted.trim()) return { error: 'An invite code is required.' }
    if (!inviteCodeMatches(submitted)) return { error: 'That invite code is not valid.' }
  }

  const parsed = credentials.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? ''),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { email, password } = parsed.data
  const productName = String(formData.get('product') ?? '').trim()
  if (!productName) return { error: 'Name the product you are grounding.' }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) return { error: 'That email already has an account. Sign in instead.' }

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: hashPassword(password) })
    .returning({ id: users.id })

  // A workspace with no name is useless, so it is created with the account.
  let slug = slugify(productName)
  const [slugTaken] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1)
  if (slugTaken) slug = `${slug}-${newToken(3).toLowerCase()}`

  await db.insert(workspaces).values({
    ownerId: user.id,
    name: productName,
    slug,
    mcpToken: newMcpToken(),
  })

  await startSession(user.id)
  redirect('/context')
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.' }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  // One message for both cases, so the form cannot be used to enumerate accounts.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: 'That email and password do not match.' }
  }

  await startSession(user.id)
  redirect('/context')
}

export async function signOut() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await db.delete(sessions).where(eq(sessions.token, token))
  await clearSessionCookie()
  redirect('/login')
}
