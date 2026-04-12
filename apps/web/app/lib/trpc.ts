import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@product-os/api'

export const trpc = createTRPCReact<AppRouter>()
