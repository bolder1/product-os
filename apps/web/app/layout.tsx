import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Product OS',
  description: 'Unified Product Intelligence and Execution System',
}

/**
 * R19 — Inline pre-paint theme script.
 *
 * Runs before React hydrates so the correct data-theme attribute is
 * set before the first paint. Avoids a dark→light flash on light-mode
 * reload. Mirrors the shadcn/ui pattern.
 *
 * Must stay inline (not imported) so it executes synchronously.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('product-os-theme');
    var theme = (stored === 'light' || stored === 'dark' || stored === 'dark-hc') ? stored : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
