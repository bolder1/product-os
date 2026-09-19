import { cn } from '../lib/utils'

/**
 * Ground's mark: a horizon line with structure beneath it.
 * The strata below the line are what an agent stands on.
 */
export function Logo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Ground"
      className={cn('g-logo', className)}
    >
      <path d="M2 8.5h20" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M5 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.62" />
      <path d="M8.5 19h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.34" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('g-wordmark', className)}>
      <Logo />
      <span>Ground</span>
    </span>
  )
}
