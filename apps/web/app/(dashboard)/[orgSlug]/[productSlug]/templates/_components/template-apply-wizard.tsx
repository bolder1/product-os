'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Check, Circle, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { Template } from '../_data/templates'
import { useGraphStore, type NodeKind } from '../../../../../lib/graph-store'
import { useActivityStore } from '../../../../../lib/activity-store'
import { useNotificationStore } from '../../../../../lib/notification-store'

const kindColors: Record<string, string> = {
  module: '#3B82F6',
  feature: '#8B5CF6',
  page: '#06B6D4',
  entity: '#10B981',
  component: '#F59E0B',
  token: '#EC4899',
  workflow: '#10B981',
  screen: '#06B6D4',
  variant: '#F43F5E',
  journey: '#8B5CF6',
  asset: '#64748B',
}

const steps = [
  { label: 'Customize', description: 'Set your variables' },
  { label: 'Preview', description: 'Review what will be created' },
  { label: 'Apply', description: 'Confirm and create' },
]

interface TemplateApplyWizardProps {
  template: Template | null
  onClose: () => void
}

export function TemplateApplyWizard({ template, onClose }: TemplateApplyWizardProps) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!template) return {}
    const init: Record<string, string> = {}
    template.variables.forEach((v) => {
      init[v.key] = v.default
    })
    return init
  })
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState(false)

  const params = useParams()
  const productId = `${params.orgSlug}-${params.productSlug}`
  const { bulkAddNodes, addEdge } = useGraphStore()
  const { addActivity } = useActivityStore()
  const { addNotification } = useNotificationStore()

  if (!template) return null

  const handleApply = () => {
    setApplying(true)

    // Create graph nodes from template
    const validKinds = new Set([
      'product', 'plan', 'template_bundle', 'module', 'feature', 'journey',
      'page', 'route', 'screen', 'workflow', 'entity', 'field',
      'component', 'variant', 'token', 'asset', 'task', 'approval',
      'insight', 'release', 'connector_binding', 'mcp_binding',
      'skill_action', 'computer_action',
    ])

    const nodesData = template.nodes.map((n) => ({
      kind: (validKinds.has(n.kind) ? n.kind : 'module') as NodeKind,
      label: n.label.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || key),
      productId,
      data: { templateId: template.id, templateNode: n.kind },
    }))

    const createdNodes = bulkAddNodes(nodesData)

    // Create edges between nodes
    template.edges.forEach((e) => {
      const sourceNode = createdNodes[e.sourceIndex]
      const targetNode = createdNodes[e.targetIndex]
      if (sourceNode && targetNode) {
        const validEdgeKinds = new Set([
          'contains', 'depends_on', 'references', 'implements',
          'inherits', 'triggers', 'routes_to', 'uses_token',
          'uses_component', 'assigned_to', 'approves', 'blocks',
        ])
        addEdge({
          kind: (validEdgeKinds.has(e.kind) ? e.kind : 'contains') as any,
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          productId,
        })
      }
    })

    // Log activity
    addActivity({
      type: 'template_applied',
      title: `Applied template "${template.name}"`,
      description: `${template.nodes.length} nodes created from ${template.category} template`,
      actor: { id: 'current-user', name: 'You', initials: 'YO' },
      productId,
      studio: 'templates',
    })

    // Notification
    addNotification({
      type: 'system',
      title: 'Template Applied',
      body: `"${template.name}" template has been applied. ${template.nodes.length} graph nodes created.`,
      priority: 'normal',
      productId,
      studio: 'templates',
    })

    setTimeout(() => {
      setApplying(false)
      setDone(true)
    }, 1500)
  }

  const groupedNodes = (() => {
    const groups: Record<string, typeof template.nodes> = {}
    template.nodes.forEach((n) => {
      if (!groups[n.kind]) groups[n.kind] = []
      groups[n.kind].push(n)
    })
    return groups
  })()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#060918]/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0C1024] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Apply: {template.name}</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {steps[step].description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-[#64748B] hover:text-[#94A3B8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center px-6 py-3 border-b border-white/[0.06] bg-white/[0.01]">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-colors ${
                      i < step
                        ? 'bg-[#3B82F6]/20 border-[#3B82F6]/40 text-[#3B82F6]'
                        : i === step
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : 'bg-white/[0.03] border-white/[0.08] text-[#64748B]'
                    }`}
                  >
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      i <= step ? 'text-[#F1F5F9]' : 'text-[#64748B]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-12 h-px mx-3 bg-white/[0.08]">
                    <div
                      className="h-full bg-[#3B82F6] transition-all"
                      style={{ width: i < step ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Customize Variables */}
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-[#94A3B8] mb-4">
                    Customize the template variables below before applying.
                  </p>
                  {template.variables.map((v) => (
                    <div key={v.key}>
                      <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                        {v.label}
                      </label>
                      <input
                        type="text"
                        value={values[v.key] || ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [v.key]: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/25 transition-colors"
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Step 2: Preview */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-[#94A3B8] mb-4">
                    The following nodes and edges will be created in your product graph.
                  </p>

                  {/* Variables summary */}
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                    <h4 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-2">Variables</h4>
                    {template.variables.map((v) => (
                      <div key={v.key} className="flex items-center justify-between text-xs">
                        <span className="text-[#94A3B8]">{v.label}</span>
                        <span className="text-[#F1F5F9] font-mono">{values[v.key]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Nodes to create */}
                  {Object.entries(groupedNodes).map(([kind, nodes]) => (
                    <div key={kind}>
                      <div className="flex items-center gap-2 mb-2">
                        <Circle
                          className="w-2.5 h-2.5"
                          fill={kindColors[kind] || '#64748B'}
                          stroke="none"
                        />
                        <span className="text-xs font-medium text-[#94A3B8] capitalize">{kind}s</span>
                        <span className="text-[10px] text-[#64748B]">({nodes.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-4 mb-2">
                        {nodes.map((n) => (
                          <span
                            key={n.label}
                            className="px-2.5 py-1 rounded-md text-xs border"
                            style={{
                              backgroundColor: `${kindColors[kind] || '#64748B'}10`,
                              borderColor: `${kindColors[kind] || '#64748B'}20`,
                              color: kindColors[kind] || '#64748B',
                            }}
                          >
                            {n.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-[#94A3B8]">
                    Total: {template.nodeCount} nodes, {template.edgeCount} edges
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirm */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  {done ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-16 h-16 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mb-4"
                      >
                        <Check className="w-8 h-8 text-[#10B981]" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">Template Applied!</h3>
                      <p className="text-sm text-[#94A3B8] max-w-sm">
                        {template.nodeCount} nodes and {template.edgeCount} edges have been added to your product graph.
                      </p>
                    </>
                  ) : applying ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-16 h-16 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center mb-4"
                      >
                        <Loader2 className="w-8 h-8 text-[#3B82F6]" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">Applying Template...</h3>
                      <p className="text-sm text-[#94A3B8]">Creating nodes and edges in your product graph.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center mb-4">
                        <span className="text-2xl">T</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">Ready to Apply</h3>
                      <p className="text-sm text-[#94A3B8] max-w-sm">
                        This will create {template.nodeCount} nodes and {template.edgeCount} edges using the &quot;{template.name}&quot; template.
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
            <button
              onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
              disabled={applying || done}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {done ? (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-[#10B981] text-white hover:bg-[#059669] transition-colors"
              >
                Done
              </button>
            ) : step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors disabled:opacity-60 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Apply
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
