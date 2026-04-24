/**
 * /graph-explorer is retired — all functionality lives in /graph (Living Graph).
 * This page permanently redirects there.
 */
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ orgSlug: string; productSlug: string }>
  searchParams?: Promise<{ focus?: string }>
}

export default async function GraphExplorerRedirect({ params, searchParams }: Props) {
  const { orgSlug, productSlug } = await params
  const sp = searchParams ? await searchParams : {}
  const focusParam = sp.focus ? `?focus=${sp.focus}` : ''
  redirect(`/${orgSlug}/${productSlug}/graph${focusParam}`)
}
