'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  X,
} from 'lucide-react'
import { useInsightStore, type Experiment } from '../../../../../lib/insight-store'

interface ExperimentTrackerProps {
  productId: string
}

const statusConfig: Record<Experiment['status'], { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-[#94A3B8]', bg: 'bg-white/[0.06]' },
  running: { label: 'Running', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  paused: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  completed: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-[#64748B]', bg: 'bg-white/[0.03]' },
}

export function ExperimentTracker({ productId }: ExperimentTrackerProps) {
  const allExperiments = useInsightStore((s) => s.experiments)
  const addExperiment = useInsightStore((s) => s.addExperiment)
  const updateExperiment = useInsightStore((s) => s.updateExperiment)

  const experiments = useMemo(
    () => allExperiments.filter((e) => e.productId === productId),
    [allExperiments, productId]
  )

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHypothesis, setNewHypothesis] = useState('')
  const [newVariantA, setNewVariantA] = useState('')
  const [newVariantB, setNewVariantB] = useState('')
  const [newMetric, setNewMetric] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    addExperiment({
      productId,
      name: newName.trim(),
      hypothesis: newHypothesis.trim(),
      status: 'draft',
      variant_a: newVariantA.trim() || 'Control',
      variant_b: newVariantB.trim() || 'Variant B',
      metric: newMetric.trim() || 'Conversion Rate',
      targetSampleSize: 1000,
      currentSampleSize: 0,
    })
    setNewName('')
    setNewHypothesis('')
    setNewVariantA('')
    setNewVariantB('')
    setNewMetric('')
    setShowCreate(false)
  }

  function toggleStatus(exp: Experiment) {
    if (exp.status === 'draft') {
      updateExperiment(exp.id, {
        status: 'running',
        currentSampleSize: Math.floor(Math.random() * 200) + 50,
      })
    } else if (exp.status === 'running') {
      updateExperiment(exp.id, { status: 'paused' })
    } else if (exp.status === 'paused') {
      updateExperiment(exp.id, { status: 'running' })
    }
  }

  function completeExperiment(exp: Experiment) {
    const aVal = Math.random() * 10 + 2
    const bVal = aVal * (0.8 + Math.random() * 0.5)
    const confidence = 80 + Math.random() * 19
    updateExperiment(exp.id, {
      status: 'completed',
      currentSampleSize: exp.targetSampleSize,
      results: {
        variant_a_value: Math.round(aVal * 100) / 100,
        variant_b_value: Math.round(bVal * 100) / 100,
        confidence: Math.round(confidence * 10) / 10,
        winner: bVal > aVal ? 'b' : 'a',
      },
    })
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-sm font-medium text-[#F1F5F9]">Experiments</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8]">
            {experiments.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.06]"
          >
            <div className="p-4 space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Experiment name"
                className="w-full px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
              />
              <input
                value={newHypothesis}
                onChange={(e) => setNewHypothesis(e.target.value)}
                placeholder="Hypothesis (e.g. Shorter form will increase signups by 15%)"
                className="w-full px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newVariantA}
                  onChange={(e) => setNewVariantA(e.target.value)}
                  placeholder="Variant A (Control)"
                  className="px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
                />
                <input
                  value={newVariantB}
                  onChange={(e) => setNewVariantB(e.target.value)}
                  placeholder="Variant B"
                  className="px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
                />
              </div>
              <input
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
                placeholder="Success metric (e.g. Conversion Rate)"
                className="w-full px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1 rounded text-xs text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-3 py-1 rounded text-xs font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors disabled:opacity-40"
                >
                  Create Experiment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Experiment list */}
      <div className="divide-y divide-white/[0.04]">
        {experiments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FlaskConical className="w-8 h-8 text-[#475569] mb-2" />
            <p className="text-xs text-[#64748B]">No experiments yet</p>
            <p className="text-[0.625rem] text-[#475569] mt-0.5">Create one to start A/B testing</p>
          </div>
        ) : (
          experiments.map((exp) => {
            const config = statusConfig[exp.status]
            const progress = exp.targetSampleSize > 0
              ? Math.min(100, Math.round((exp.currentSampleSize / exp.targetSampleSize) * 100))
              : 0

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-[#F1F5F9] truncate">{exp.name}</p>
                      <span className={`text-[0.625rem] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    {exp.hypothesis && (
                      <p className="text-[0.625rem] text-[#64748B] mt-0.5 line-clamp-1">{exp.hypothesis}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {(exp.status === 'draft' || exp.status === 'paused') && (
                      <button
                        onClick={() => toggleStatus(exp)}
                        className="p-1 rounded hover:bg-white/[0.06] text-emerald-400 transition-colors"
                        title="Start"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {exp.status === 'running' && (
                      <>
                        <button
                          onClick={() => toggleStatus(exp)}
                          className="p-1 rounded hover:bg-white/[0.06] text-amber-400 transition-colors"
                          title="Pause"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => completeExperiment(exp)}
                          className="p-1 rounded hover:bg-white/[0.06] text-blue-400 transition-colors"
                          title="Complete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Variants */}
                <div className="flex items-center gap-2 text-[0.625rem] mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">A: {exp.variant_a}</span>
                  <ArrowRight className="w-3 h-3 text-[#475569]" />
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">B: {exp.variant_b}</span>
                  <span className="text-[#475569]">·</span>
                  <span className="text-[#64748B]">{exp.metric}</span>
                </div>

                {/* Progress bar */}
                {(exp.status === 'running' || exp.status === 'paused') && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[0.625rem] mb-1">
                      <span className="text-[#64748B]">Sample progress</span>
                      <span className="text-[#94A3B8]">{exp.currentSampleSize}/{exp.targetSampleSize}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#8B5CF6] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results */}
                {exp.results && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2 mt-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[0.625rem] text-[#64748B]">Variant A</p>
                        <p className={`text-sm font-bold ${exp.results.winner === 'a' ? 'text-emerald-400' : 'text-[#94A3B8]'}`}>
                          {exp.results.variant_a_value}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.625rem] text-[#64748B]">Variant B</p>
                        <p className={`text-sm font-bold ${exp.results.winner === 'b' ? 'text-emerald-400' : 'text-[#94A3B8]'}`}>
                          {exp.results.variant_b_value}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.625rem] text-[#64748B]">Confidence</p>
                        <p className="text-sm font-bold text-[#F1F5F9]">{exp.results.confidence}%</p>
                      </div>
                    </div>
                    {exp.results.winner && exp.results.winner !== 'none' && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-[0.625rem] text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        Winner: Variant {exp.results.winner.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
