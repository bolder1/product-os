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
import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { GitBranch, MessageSquare, X, CircleDot } from 'lucide-react'

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
  const product = useMemo(() => allProducts.find((p) => p.orgSlug === orgSlug && p.slug === productSlug) ?? null, [allProducts, orgSlug, productSlug])
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
  const { isLoading: isSyncing } = useDataSync(dbProductId)
  usePhase19Sync(dbProductId)

  const segments = pathname.split('/')
  const currentStudio = segments[3] || 'planner'
  const productId = product?.id ?? `${orgSlug}-${productSlug}`
  const activeBranch = activeBranches[productId] ?? 'main'
  const commentEntityId = `${productId}-${currentStudio}`

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
}) {
  const { status, peers, setActiveStudio } = useCollaborationContext()

  const commentEntityId = `${productId}-${currentStudio}`

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

          <main className="flex-1 min-h-0 overflow-auto bg-[var(--bg-workspace)]">
            <div className="min-h-full">
              {children}
            </div>
          </main>

          {/* ── Status Bar ── */}
          <div className="h-[var(--statusbar-h)] flex items-center justify-between px-3 bg-[var(--bg-surface)] border-t border-[var(--border-default)] flex-shrink-0 text-[10px] select-none">
            <div className="flex items-center gap-4">
              <button
                onClick={openVersionPanel}
                className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <GitBranch size={11} strokeWidth={1.75} />
                <span className="font-medium">{activeBranch}</span>
              </button>

              <ValidationTrigger productId={productId} compact />

              <button
                onClick={() => setCommentsOpen(!commentsOpen)}
                className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <MessageSquare size={11} strokeWidth={1.75} />
                <span>{unresolvedCount > 0 ? `${unresolvedCount} open` : 'Comments'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-[var(--text-tertiary)]">
              {peers.length > 0 && (
                <span className="text-[var(--accent)]">{peers.length} collaborator{peers.length !== 1 ? 's' : ''}</span>
              )}
              <div className="flex items-center gap-1.5">
                <CircleDot size={9} className="text-[var(--color-success)]" />
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
                  <span className="tool-badge-accent text-[9px]">{unresolvedCount}</span>
                )}
              </div>
              <button
                onClick={() => setCommentsOpen(false)}
                className="tool-btn-ghost tool-btn-icon"
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
          contextHints={[product?.slug ?? productId, currentStudio]}
        />
      </div>
  )
}
