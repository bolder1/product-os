'use client'

interface AnimatedLogoProps {
  size?: 'compact' | 'expanded'
}

export function AnimatedLogo({ size = 'compact' }: AnimatedLogoProps) {
  const dim = size === 'compact' ? 20 : 24

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-200 hover:scale-110"
    >
      <rect x="2" y="2" width="7" height="7" rx="2" fill="var(--accent)" />
      <rect x="11" y="2" width="7" height="7" rx="2" fill="var(--accent)" fillOpacity="0.45" />
      <rect x="2" y="11" width="7" height="7" rx="2" fill="var(--accent)" fillOpacity="0.45" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="var(--accent)" fillOpacity="0.2" />
    </svg>
  )
}
