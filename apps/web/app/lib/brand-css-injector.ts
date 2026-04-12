'use client'

/**
 * Injects brand token CSS custom properties into the document root.
 * Call this once after brand tokens load/change to make tokens
 * available to all components via var(--color-primary), etc.
 */

const STYLE_ID = 'product-os-brand-tokens'

export function injectBrandCSS(cssText: string): void {
  if (typeof document === 'undefined') return

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    style.setAttribute('data-product-os', 'brand-tokens')
    document.head.appendChild(style)
  }
  style.textContent = cssText
}

export function removeBrandCSS(): void {
  if (typeof document === 'undefined') return
  const style = document.getElementById(STYLE_ID)
  if (style) style.remove()
}
