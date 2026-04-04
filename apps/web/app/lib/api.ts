'use client'

/**
 * Direct tRPC caller for use outside React components (Zustand stores).
 * Mutations go through this; queries use trpc hooks inside components.
 */

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (typeof window === 'undefined') return headers
  const token = localStorage.getItem('product-os-session-token')
  const orgId = localStorage.getItem('product-os-org-id')
  if (token) headers['authorization'] = `Bearer ${token}`
  if (orgId) headers['x-org-id'] = orgId
  return headers
}

/**
 * Call a tRPC mutation procedure directly via fetch.
 * Returns the unwrapped result (handles superjson wrapper).
 */
export async function trpcMutate<T>(procedure: string, input: unknown): Promise<T> {
  const res = await fetch(`/api/trpc/${procedure}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ json: input }),
  })
  const json = await res.json()
  if (json.error) {
    const msg = json.error.json?.message ?? json.error.message ?? 'Request failed'
    throw new Error(msg)
  }
  const data = json.result?.data
  return (data?.json ?? data) as T
}

/**
 * Call a tRPC query procedure directly via fetch.
 */
export async function trpcQuery<T>(procedure: string, input: unknown): Promise<T> {
  const encoded = encodeURIComponent(JSON.stringify({ json: input }))
  const res = await fetch(`/api/trpc/${procedure}?input=${encoded}`, {
    method: 'GET',
    headers: getHeaders(),
  })
  const json = await res.json()
  if (json.error) {
    const msg = json.error.json?.message ?? json.error.message ?? 'Request failed'
    throw new Error(msg)
  }
  const data = json.result?.data
  return (data?.json ?? data) as T
}
