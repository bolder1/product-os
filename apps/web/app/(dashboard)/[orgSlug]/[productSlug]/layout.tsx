'use client'

import { use, useMemo } from 'react'
import { useState } from 'react'
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
import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { GitBranch, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Product context ── */
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

  // Derive current studio from pathname
  const segments = pathname.split('/')
  const currentStudio = segments[3] || 'planner'
  const productId = `${orgSlug}-${productSlug}`
  const activeBranch = activeBranches[productId] ?? 'main'
  const commentEntityId = `${productId}-${currentStudio}`

  return (
    <ProductContext.Provider value={product}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>

        {/* Floating action pills */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          {/* Comments pill */}
          <button
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0E23] border border-white/[0.08] text-xs font-medium text-[#94A3B8] hover:border-[#6366F1]/40 hover:text-[#F1F5F9] transition-all shadow-lg"
            title="Comments"
          >
            <MessageSquare size={13} className="text-[#6366F1]" />
            Comments
            {unresolvedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#F43F5E] text-[0.5rem] font-bold text-white flex items-center justify-center">
                {unresolvedCount}
              </span>
            )}
          </button>

          {/* Validation trigger */}
          <ValidationTrigger productId={productId} />

          {/* Version branch pill */}
          <button
            onClick={openVersionPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0E23] border border-white/[0.08] text-xs font-medium text-[#94A3B8] hover:border-[#8B5CF6]/40 hover:text-[#F1F5F9] transition-all shadow-lg"
            title="Version History"
          >
            <GitBranch size={13} className="text-[#8B5CF6]" />
            {activeBranch}
          </button>
        </div>

        {/* Comments slide-in panel */}
        <AnimatePresence>
          {commentsOpen && (
            <motion.div
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[340px] z-50 bg-[#0A0F1E] border-l border-white/[0.08] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#6366F1]" />
                  <span className="text-sm font-medium text-[#F1F5F9]">
                    {currentStudio.charAt(0).toUpperCase() + currentStudio.slice(1)} Comments
                  </span>
                </div>
                <button
                  onClick={() => setCommentsOpen(false)}
                  className="p-1 rounded-md hover:bg-white/[0.06] text-[#64748B]"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <CommentThread
                  entityId={commentEntityId}
                  entityType="studio"
                  productId={productId}
                  studio={currentStudio}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ValidationPanel productId={productId} />
        <VersionHistoryPanel productId={productId} />
        <TasksPanel />
        <AIAssistantPanel
          studio={currentStudio}
          productId={productId}
          contextHints={[productSlug, currentStudio]}
        />
      </div>
    </ProductContext.Provider>
  )
}
