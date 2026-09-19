import { redirect } from 'next/navigation'
import { getViewer } from '../_lib/session'

/**
 * A signed-in account with no workspace should not exist — sign-up creates one
 * atomically. This catches the impossible case rather than rendering a dead end.
 */
export default async function WelcomePage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  redirect('/signup')
}
