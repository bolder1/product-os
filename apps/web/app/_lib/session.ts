import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, gt } from 'drizzle-orm'
import { db, sessions, users, workspaces } from '@ground/core/server'

export const SESSION_COOKIE = 'ground_session'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export interface Viewer {
  userId: string
  email: string
  name: string | null
}

/** Resolves the signed-in user, or null. Never throws on a missing cookie. */
export async function getViewer(): Promise<Viewer | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null

  const [row] = await db
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  return row ?? null
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  return viewer
}

/** The viewer's workspace. Every account has exactly one in the MVP. */
export async function requireWorkspace() {
  const viewer = await requireViewer()
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, viewer.userId))
    .limit(1)

  if (!workspace) redirect('/welcome')
  return { viewer, workspace }
}
