/**
 * R7 — Legacy `/tasks` route redirects to the unified Work studio.
 */

import { redirect } from 'next/navigation'

export default async function LegacyTasksPage({
  params,
}: {
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  const { orgSlug, productSlug } = await params
  redirect(`/${orgSlug}/${productSlug}/work?tab=tasks`)
}
