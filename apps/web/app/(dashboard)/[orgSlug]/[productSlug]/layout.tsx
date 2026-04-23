'use client'

import { use, useMemo, useState, useEffect } from 'react'
import { Sidebar } from '../../../components/shell/sidebar'
import { TopBar } from '../../../components/shell/topbar'
import { TasksPanel } from '../../../components/shell/tasks-panel'
import { AIAssistantPanel } from '../../../components/shared/ai-assistant-panel'
import { VersionHistoryPanel } from '../../../components/shared/version-history-panel'
import { CommentThread } from '../../../components/shared/comment-thread'
import { ValidationPanel, ValidationTrigger } from '../../../components/shared/validation-panel'
import { useProductStore, type Product } from '../../../lib/product-store'
import { useVersionStore } from '../../../lib/version-store'
import { useCommentStore } from '../../../lib/comment-store'
import { useDataSync } from '../../../lib/use-data-sync'
import { usePhase19Sync } from '../../../lib/use-phase19-sync'
import { CollaborationProvider, useCollaborationContext } from '../../../lib/collaboration-context'
import { PresenceAvatars, ConnectionBadge } from '../../_components/presence-avatars'
import { ComputerModePanel } from '../../../components/shared/computer-mode-panel'
import { ComputerModeStrip } from '../../../components/shared/computer-mode-strip'
import { GraphInspector } from '../../../components/shared/graph-inspector'
import { Copilot } from '../../../components/shared/copilot'
import { CommandPalette } from '../../../components/shared/command-palette'
import { OpsPilot } from '../../../components/shared/ops-pilot'
import { PromptGateHost } from '../../../components/shared/prompt-gate-host'
import { useCommandPaletteStore } from '../../../lib/command-palette-store'
import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { GitBranch, MessageSquare, X, CircleDot, Search } from 'lucide-react'
import { FirstRunBanner } from './_components/first-run-banner'
import { ModesTour } from './_components/modes-tour'

export const ProductContext = createContext<Product | null>(null)

export function useProduct() {
  return useContext(ProductContext)
}

export default function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  const { orgSlug, productSlug } = use(params)
  const allProducts = useProductStore((s) => s.products)
  // Match by orgSlug+slug, or fall back to slug-only for legacy products with empty orgSlug
  const product = useMemo(
    () =>
      allProducts.find((p) => p.slug === productSlug && (p.orgSlug === orgSlug || p.orgSlug === '')) ?? null,
    [allProducts, orgSlug, productSlug],
  )
  const pathname = usePathname()
  const openVersionPanel = useVersionStore((s) => s.openPanel)
  const activeBranches = useVersionStore((s) => s.activeBranches)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const allComments = useCommentStore((s) => s.comments)
  const unresolvedCount = useMemo(() => {
    const entityId = `${orgSlug}-${productSlug}-${pathname.split('/')[3] || 'planner'}`
    return allComments.filter((c) => c.entityId === entityId && !c.resolved && !c.parentId).length
  }, [allComments, orgSlug, productSlug, pathname])

  // Resolve real DB product ID for data sync; fall back to composite slug
  const dbProductId = product?.id ?? undefined
  useDataSync(dbProductId)
  usePhase19Sync(dbProductId)

  // Cmd+K / Ctrl+K is handled by the CommandPaletteStore directly via TopBar

  const segments = pathname.split('/')
  const currentStudio = segments[3] || 'planner'
  const productId = product?.id ?? `${orgSlug}-${productSlug}`
  const activeBranch = activeBranches[productId] ?? 'main'
  const collabRoom = dbProductId ? `product:${dbProductId}` : null

  return (
    <ProductContext.Provider value={product}>
      <CollaborationProvider roomName={collabRoom}>
        <ProductLayoutInner
          product={product}
          productId={productId}
          currentStudio={currentStudio}
          activeBranch={activeBranch}
          openVersionPanel={openVersionPanel}
          commentsOpen={commentsOpen}
          setCommentsOpen={setCommentsOpen}
          unresolvedCount={unresolvedCount}
          orgSlug={orgSlug}
          productSlug={productSlug}
        >
          {children}
        </ProductLayoutInner>
      </CollaborationProvider>
    </ProductContext.Provider>
  )
}

/** Inner component so it can access CollaborationContext */
function ProductLayoutInner({
  children,
  product,
  productId,
  currentStudio,
  activeBranch,
  openVersionPanel,
  commentsOpen,
  setCommentsOpen,
  unresolvedCount,
  orgSlug,
  productSlug,
}: {
  children: React.ReactNode
  product: Product | null
  productId: string
  currentStudio: string
  activeBranch: string
  openVersionPanel: () => void
  commentsOpen: boolean
  setCommentsOpen: (v: boolean) => void
  unresolvedCount: number
  orgSlug: string
  productSlug: string
}) {
  const { status, peers, setActiveStudio } = useCollaborationContext()
  // Drive palette from the store — single source of truth (TopBar also uses this)
  const paletteOpen = useCommandPaletteStore((s) => s.isOpen)
  const openPalette = useCommandPaletteStore((s) => s.open)
  const closePalette = useCommandPaletteStore((s) => s.close)

  const commentEntityId = `${productId}-${currentStudio}`
  const dbProductId = product?.id

  // Memoize contextHints so AIAssistantPanel doesn't get a new array ref every render
  const contextHints = useMemo(
    () => [product?.slug ?? productId, currentStudio],
    [product?.slug, productId, currentStudio]
  )

  // Update active studio in presence
  useEffect(() => {
    setActiveStudio(currentStudio)
  }, [currentStudio, setActiveStudio])

  return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar
            extraRight={
              <div className="flex items-center gap-2">
                <PresenceAvatars peers={peers} />
                <ConnectionBadge status={status} />
              </div>
            }
          />
          <ComputerModeStrip />

          <main className="flex-1 min-h-0 overflow-auto bg-[var(--bg-workspace)]">
            <div className="min-h-full flex flex-col">
              <FirstRunBanner productId={productId} />
              <ModesTour />
              {children}
            </div>
          </main>

          {/* ── Status Bar ── */}
          <div className="h-[var(--statusbar-h)] flex items-center justify-between px-3 bg-[var(--bg-surface)] border-t border-[var(--border-default)] flex-shrink-0 text-[11px] select-none" role="status" aria-label="Product status bar">

            <div className="flex items-center gap-4">
              <button
                onClick={openVersionPanel}
                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={`Branch: ${activeBranch}`}
              >
                <GitBranch size={11} strokeWidth={1.75} />
                <span className="font-medium">{activeBranch}</span>
              </button>

              <ValidationTrigger productId={productId} compact />

              <button
                onClick={() => setCommentsOpen(!commentsOpen)}
                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={unresolvedCount > 0 ? `${unresolvedCount} open comments` : 'Comments'}
              >
                <MessageSquare size={11} strokeWidth={1.75} />
                <span>{unresolvedCount > 0 ? `${unresolvedCount} open` : 'Comments'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-[var(--text-secondary)]">
              {peers.length > 0 && (
                <span className="text-[var(--accent)]">{peers.length} collaborator{peers.length !== 1 ? 's' : ''}</span>
              )}
              {/* Cmd+K trigger */}
              <button
                onClick={openPalette}
                className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Search — Command K"
              >
                <Search size={10} />
                <span>Search</span>
                <kbd className="ml-0.5 px-1 py-px rounded bg-white/[0.08] text-[10px] font-mono">⌘K</kbd>
              </button>
              <div className="flex items-center gap-1.5">
                <CircleDot size={10} className="text-[var(--color-success)]" />
                <span>Ready</span>
              </div>
              <span className="opacity-50">{currentStudio}</span>
            </div>
          </div>
        </div>

        {/* ── Comments Panel ── */}
        {commentsOpen && (
          <div
            className="fixed top-0 right-0 bottom-0 w-[320px] z-50 bg-[var(--bg-surface)] border-l border-[var(--border-default)] flex flex-col"
            style={{ animation: 'slideInRight 200ms cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: 'var(--shadow-panel)' }}
          >
            <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <MessageSquare size={13} className="text-[var(--accent)]" />
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Comments</span>
                {unresolvedCount > 0 && (
                  <span className="tool-badge-accent text-[10px]">{unresolvedCount}</span>
                )}
              </div>
              <button
                onClick={() => setCommentsOpen(false)}
                className="tool-btn-ghost tool-btn-icon"
                aria-label="Close comments"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <CommentThread
                entityId={commentEntityId}
                entityType="studio"
                productId={productId}
                studio={currentStudio}
              />
            </div>
          </div>
        )}

        <ValidationPanel productId={productId} />
        <VersionHistoryPanel productId={productId} />
        <TasksPanel />
        <AIAssistantPanel
          studio={currentStudio}
          productId={productId}
          contextHints={contextHints}
        />
        <ComputerModePanel
          studio={currentStudio}
          productId={dbProductId}
        />
        <GraphInspector
          productId={productId}
          orgSlug={orgSlug}
          productSlug={productSlug}
        />
        <Copilot
          productId={productId}
          orgSlug={orgSlug}
          productSlug={productSlug}
          studio={currentStudio}
        />
        <CommandPalette
          isOpen={paletteOpen}
          onClose={closePalette}
          orgSlug={orgSlug}
          productSlug={productSlug}
          currentStudio={currentStudio}
          productId={dbProductId}
        />

        {/* ── OpsPilot AI Copilot ── */}
        {dbProductId && (
          <OpsPilot
            productId={dbProductId}
            currentStudio={currentStudio}
            orgSlug={orgSlug}
            productSlug={productSlug}
          />
        )}

        {/* ── Prompt gate (pre-flight surface for every prompt entry) ── */}
        <PromptGateHost />
      </div>
  )
}
