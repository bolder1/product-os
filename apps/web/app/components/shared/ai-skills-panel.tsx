'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Sparkles,
  Zap,
  Play,
  Pause,
  Shield,
  Eye,
  Hand,
  Bot,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
} from 'lucide-react'
import {
  useAISkillsStore,
  type AISkillFamily,
  type ComputerMode,
  type AISkill,
} from '../../lib/ai-skills-store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const familyMeta: Record<AISkillFamily, { label: string; color: string; icon: React.ReactNode }> = {
  product: { label: 'Product', color: 'text-blue-400', icon: <Sparkles className="w-3.5 h-3.5" /> },
  design: { label: 'Design', color: 'text-purple-400', icon: <Eye className="w-3.5 h-3.5" /> },
  engineering: { label: 'Engineering', color: 'text-emerald-400', icon: <Zap className="w-3.5 h-3.5" /> },
  growth: { label: 'Growth', color: 'text-amber-400', icon: <ChevronRight className="w-3.5 h-3.5" /> },
  system: { label: 'System', color: 'text-cyan-400', icon: <Settings className="w-3.5 h-3.5" /> },
}

const modeMeta: Record<ComputerMode, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  suggest: {
    label: 'Suggest',
    description: 'AI analyzes and recommends. Never commits changes.',
    icon: <Eye className="w-4 h-4" />,
    color: 'border-blue-500/30 bg-blue-500/5',
  },
  assist: {
    label: 'Assist',
    description: 'AI creates drafts for your review. You approve before any change applies.',
    icon: <Hand className="w-4 h-4" />,
    color: 'border-amber-500/30 bg-amber-500/5',
  },
  autopilot: {
    label: 'Autopilot',
    description: 'AI executes within policy bounds. Actions are logged and revertible.',
    icon: <Bot className="w-4 h-4" />,
    color: 'border-emerald-500/30 bg-emerald-500/5',
  },
}

const actionClassLabels: Record<string, string> = {
  suggest: 'Suggest',
  scaffold: 'Scaffold',
  transform: 'Transform',
  analyze: 'Analyze',
  operate: 'Operate',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AISkillsPanelProps {
  productId: string
  open: boolean
  onClose: () => void
}

export function AISkillsPanel({ productId, open, onClose }: AISkillsPanelProps) {
  const skills = useAISkillsStore((s) => s.skills)
  const executions = useAISkillsStore((s) => s.executions)
  const computerMode = useAISkillsStore((s) => s.computerMode)
  const setComputerMode = useAISkillsStore((s) => s.setComputerMode)
  const executeSkill = useAISkillsStore((s) => s.executeSkill)
  const toggleSkill = useAISkillsStore((s) => s.toggleSkill)
  const actionLog = useAISkillsStore((s) => s.computerMode.actionLog)

  const [activeTab, setActiveTab] = useState<'skills' | 'mode' | 'history'>('skills')
  const [activeFamily, setActiveFamily] = useState<AISkillFamily | 'all'>('all')
  const [runningId, setRunningId] = useState<string | null>(null)

  const filteredSkills = useMemo(
    () => activeFamily === 'all' ? skills : skills.filter((s) => s.family === activeFamily),
    [skills, activeFamily]
  )

  const recentExecs = useMemo(
    () => executions.filter((e) => e.productId === productId).slice(0, 10),
    [executions, productId]
  )

  const productActions = useMemo(
    () => actionLog.filter((a) => a.productId === productId).slice(0, 15),
    [actionLog, productId]
  )

  const handleRunSkill = useCallback((skill: AISkill) => {
    setRunningId(skill.id)
    executeSkill(skill.id, productId, { context: 'manual-trigger' })
    setTimeout(() => setRunningId(null), 3000)
  }, [executeSkill, productId])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[740px] max-h-[82vh] rounded-2xl border border-white/[0.1] bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">AI Skills & Computer Mode</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  {skills.filter((s) => s.enabled).length} skills active &middot; Mode: {modeMeta[computerMode.activeMode].label}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 py-2.5 border-b border-white/[0.04]">
            {(['skills', 'mode', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-[#6366F1]/10 text-[#818CF8]'
                    : 'text-[#475569] hover:bg-white/[0.04]'
                }`}
              >
                {tab === 'skills' ? `Skills (${skills.length})` : tab === 'mode' ? 'Computer Mode' : `History (${recentExecs.length})`}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4">
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <>
                {/* Family filter */}
                <div className="flex items-center gap-1 mb-4">
                  {(['all', 'product', 'design', 'engineering', 'growth', 'system'] as const).map((fam) => (
                    <button
                      key={fam}
                      onClick={() => setActiveFamily(fam)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors ${
                        activeFamily === fam
                          ? 'bg-[#6366F1]/10 text-[#818CF8]'
                          : 'text-[#475569] hover:bg-white/[0.04]'
                      }`}
                    >
                      {fam !== 'all' && familyMeta[fam].icon}
                      {fam === 'all' ? 'All' : familyMeta[fam].label}
                    </button>
                  ))}
                </div>

                {/* Skill cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredSkills.map((skill, i) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-xl border p-3.5 transition-all ${
                        skill.enabled
                          ? 'border-white/[0.06] bg-white/[0.02]'
                          : 'border-white/[0.03] bg-white/[0.01] opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={familyMeta[skill.family].color}>
                            {familyMeta[skill.family].icon}
                          </span>
                          <h3 className="text-xs font-semibold text-[#F1F5F9]">{skill.name}</h3>
                        </div>
                        <button
                          onClick={() => toggleSkill(skill.id)}
                          className={`w-8 h-4 rounded-full relative transition-colors ${
                            skill.enabled ? 'bg-[#6366F1]' : 'bg-white/[0.1]'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            skill.enabled ? 'left-4' : 'left-0.5'
                          }`} />
                        </button>
                      </div>

                      <p className="text-[0.6875rem] text-[#64748B] leading-relaxed mb-2">
                        {skill.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[0.5625rem]">
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[#818CF8]">
                            {actionClassLabels[skill.actionClass]}
                          </span>
                          {skill.creditCost > 0 && (
                            <span className="text-[#475569]">{skill.creditCost} credit{skill.creditCost !== 1 ? 's' : ''}</span>
                          )}
                          {skill.targetStudio && (
                            <span className="text-[#475569]">{skill.targetStudio}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRunSkill(skill)}
                          disabled={!skill.enabled || runningId === skill.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#6366F1]/10 text-[#818CF8] text-[0.625rem] font-medium hover:bg-[#6366F1]/20 transition-colors disabled:opacity-30"
                        >
                          {runningId === skill.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          Run
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Computer Mode Tab */}
            {activeTab === 'mode' && (
              <div className="space-y-4">
                {/* Mode selector */}
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(modeMeta) as [ComputerMode, typeof modeMeta.suggest][]).map(([mode, meta]) => (
                    <button
                      key={mode}
                      onClick={() => setComputerMode(mode)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        computerMode.activeMode === mode
                          ? meta.color
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={computerMode.activeMode === mode ? '' : 'text-[#475569]'}>
                          {meta.icon}
                        </span>
                        <span className="text-xs font-semibold text-[#F1F5F9]">{meta.label}</span>
                      </div>
                      <p className="text-[0.6875rem] text-[#64748B] leading-relaxed">
                        {meta.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Policy settings */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h3 className="text-xs font-semibold text-[#F1F5F9] mb-3">Execution Policy</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[0.6875rem] text-[#94A3B8]">Require approval for mutations</p>
                        <p className="text-[0.5625rem] text-[#475569]">Scaffold and transform actions need human approval</p>
                      </div>
                      <div className={`w-8 h-4 rounded-full relative ${
                        computerMode.executionPolicy.requireApprovalForMutations ? 'bg-[#6366F1]' : 'bg-white/[0.1]'
                      }`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          computerMode.executionPolicy.requireApprovalForMutations ? 'left-4' : 'left-0.5'
                        }`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[0.6875rem] text-[#94A3B8]">Max auto-actions per session</p>
                        <p className="text-[0.5625rem] text-[#475569]">Limit autopilot actions before pausing for review</p>
                      </div>
                      <span className="text-xs font-bold text-[#F1F5F9] bg-white/[0.04] px-2.5 py-1 rounded-lg">
                        {computerMode.executionPolicy.maxAutoActions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action log */}
                {productActions.length > 0 && (
                  <div>
                    <p className="text-[0.625rem] uppercase tracking-wider text-[#475569] mb-2 px-1">
                      Action Log
                    </p>
                    <div className="space-y-1">
                      {productActions.map((action) => (
                        <div key={action.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                          {action.status === 'executed' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : action.status === 'rejected' ? (
                            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          <span className="text-[0.6875rem] text-[#94A3B8] flex-1">{action.action}</span>
                          <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#475569]">
                            {action.type}
                          </span>
                          <span className="text-[0.5625rem] text-[#475569]">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-2">
                {recentExecs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Brain className="w-8 h-8 text-[#475569]" />
                    <p className="text-sm text-[#64748B]">No skill executions yet</p>
                    <p className="text-[0.6875rem] text-[#475569]">Run a skill from the Skills tab to see history.</p>
                  </div>
                ) : (
                  recentExecs.map((exec, i) => {
                    const skill = skills.find((s) => s.id === exec.skillId)
                    return (
                      <motion.div
                        key={exec.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {exec.status === 'running' ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                            ) : exec.status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span className="text-xs font-medium text-[#F1F5F9]">
                              {skill?.name ?? exec.skillId}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[0.5625rem] text-[#475569]">
                            <span className="px-1.5 py-0.5 rounded bg-white/[0.04]">
                              {modeMeta[exec.mode].label}
                            </span>
                            {exec.artifactsCreated > 0 && (
                              <span>{exec.artifactsCreated} artifact{exec.artifactsCreated !== 1 ? 's' : ''}</span>
                            )}
                            <span>{new Date(exec.startedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        {exec.error && (
                          <p className="text-[0.6875rem] text-rose-400 mt-1">{exec.error}</p>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
