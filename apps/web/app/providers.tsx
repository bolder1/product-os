'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { trpc } from './lib/trpc'

const TOKEN_KEY = 'ground.session'
const WORKSPACE_KEY = 'ground.workspace'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5_000, refetchOnWindowFocus: false },
        },
      }),
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            if (typeof window === 'undefined') return {}
            const headers: Record<string, string> = {}
            // Browser storage can throw in private mode; a missing token
            // simply means "signed out", which the server already handles.
            try {
              const token = localStorage.getItem(TOKEN_KEY)
              const workspace = localStorage.getItem(WORKSPACE_KEY)
              if (token) headers.authorization = `Bearer ${token}`
              if (workspace) headers['x-org-id'] = workspace
            } catch {
              /* no-op */
            }
            return headers
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
