import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@product-os/api'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers() {
        const headers: Record<string, string> = {}
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('product-os-session-token')
          const orgId = localStorage.getItem('product-os-org-id')
          if (token) headers['authorization'] = `Bearer ${token}`
          if (orgId) headers['x-org-id'] = orgId
        }
        return headers
      },
    }),
  ],
})
