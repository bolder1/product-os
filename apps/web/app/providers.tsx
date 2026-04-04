'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { trpc } from './lib/trpc'
import { AuthProvider } from './lib/auth-context'
import { CommandPaletteGlobal } from './components/shared/command-palette-global'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

/**
 * Wrapper that delays rendering children until after hydration to avoid
 * mismatch between server (no localStorage) and client (has localStorage).
 */
function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    // Return an empty shell with matching bg to prevent flash
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#060918' }} />
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 1000, refetchOnWindowFocus: false },
    },
  }))

  const [trpcClient] = useState(() =>
    trpc.createClient({
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
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HydrationGuard>
          <AuthProvider>
            {children}
            <CommandPaletteGlobal />
          </AuthProvider>
        </HydrationGuard>
      </QueryClientProvider>
    </trpc.Provider>
  )
}
