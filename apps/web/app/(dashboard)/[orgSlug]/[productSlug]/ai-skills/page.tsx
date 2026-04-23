/**
 * R6 — Legacy `/ai-skills` route redirects to the unified Extensions studio.
 */

import { redirect } from 'next/navigation'

export default async function LegacyAISkillsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  const { orgSlug, productSlug } = await params
  redirect(`/${orgSlug}/${productSlug}/extensions?tab=skills`)
}
