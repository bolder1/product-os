/**
 * R5 — Legacy `/brand/voice` route redirects to the unified Brand studio.
 */

import { redirect } from 'next/navigation'

export default async function LegacyBrandVoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  const { orgSlug, productSlug } = await params
  redirect(`/${orgSlug}/${productSlug}/brand?tab=voice`)
}
