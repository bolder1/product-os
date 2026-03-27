'use client'

import { usePathname } from 'next/navigation'
import { Search, Sparkles, Bell, User, ChevronRight } from 'lucide-react'

export function TopBar() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb from URL segments
  const orgSlug = segments[0] ?? ''
  const productSlug = segments[1] ?? ''
  const studioSlug = segments[2] ?? ''

  const studioLabel = studioSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <header className="glass sticky top-0 z-30 h-12 flex items-center justify-between px-4 border-b border-white/[0.08]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-[0.8125rem]">
        {orgSlug && (
          <span className="text-[#64748B] hover:text-[#94A3B8] transition-colors cursor-pointer">
            {orgSlug}
          </span>
        )}
        {productSlug && (
          <>
            <ChevronRight size={14} className="text-[#64748B]" />
            <span className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors cursor-pointer">
              {productSlug}
            </span>
          </>
        )}
        {studioLabel && (
          <>
            <ChevronRight size={14} className="text-[#64748B]" />
            <span className="text-[#F1F5F9] font-medium">
              {studioLabel}
            </span>
          </>
        )}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search / command palette */}
        <button
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[0.8125rem] text-[#64748B] hover:bg-white/[0.06] hover:text-[#94A3B8] transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search size={16} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-[0.625rem] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[#64748B]">
            Ctrl K
          </kbd>
        </button>

        {/* AI Assistant */}
        <button
          className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#8B5CF6]"
          title="AI Assistant"
        >
          <Sparkles size={18} />
        </button>

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#94A3B8]"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F43F5E] text-[0.5rem] font-bold text-white flex items-center justify-center">
            3
          </span>
        </button>

        {/* User avatar */}
        <button
          className="ml-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center hover:opacity-90 transition-opacity"
          title="Account"
        >
          <User size={14} className="text-white" />
        </button>
      </div>
    </header>
  )
}
