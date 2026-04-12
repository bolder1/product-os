'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Brain,
  Zap,
  Play,
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
  Sparkles,
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

const familyMeta: Record<AISkillFamily, { label: string; icon: React.ReactNode }> = {
  product: { label: 'Product', icon: <Sparkles className="w-3 h-3" /> },
  design: { label: 'Design', icon: <Eye className="w-3 h-3" /> },
  engineering: { label: 'Engineering', icon: <Zap className="w-3 h-3" /> },
  growth: { label: 'Growth', icon: <ChevronRight className="w-3 h-3" /> },
  system: { label: 'System', icon: <Settings className="w-3 h-3" /> },
}

const modeMeta: Record<ComputerMode, { label: string; description: string; icon: React.ReactNode }> = {
  suggest: {
    label: 'Suggest',
    description: 'AI analyzes and recommends. Never commits changes.',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  assist: {
    label: 'Assist',
    description: 'AI creates drafts for your review. You approve before any change applies.',
    icon: <Hand className="w-3.5 h-3.5" />,
  },
  autopilot: {
    label: 'Autopilot',
    description: 'AI executes within policy bounds. Actions are logged and revertible.',
    icon: <Bot className="w-3.5 h-3.5" />,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[720px] max-h-[82vh] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">AI Skills & Computer Mode</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {skills.filter((s) => s.enabled).length} active &middot; {modeMeta[computerMode.activeMode].label}
            </span>
          </div>
          <button onClick={onClose} className="tool-btn p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tool-tabs px-3">
          {(['skills', 'mode', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tool-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'skills' ? `Skills (${skills.length})` : tab === 'mode' ? 'Computer Mode' : `History (${recentExecs.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-3">
          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <>
              {/* Family filter */}
              <div className="flex items-center gap-1 mb-3">
                {(['all', 'product', 'design', 'engineering', 'growth', 'system'] as const).map((fam) => (
                  <button
                    key={fam}
                    onClick={() => setActiveFamily(fam)}
                    className={`tool-tab flex items-center gap-1 ${activeFamily === fam ? 'active' : ''}`}
                  >
                    {fam !== 'all' && familyMeta[fam].icon}
                    {fam === 'all' ? 'All' : familyMeta[fam].label}
                  </button>
                ))}
              </div>

              {/* Skill cards */}
              <div className="grid grid-cols-2 gap-2">
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`rounded-[var(--radius-md)] border p-3 transition-colors ${
                      skill.enabled
                        ? 'border-[var(--border-default)] bg-white/[0.02]'
                        : 'border-[var(--border-subtle)] bg-white/[0.01] opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--accent-text)]">
                          {familyMeta[skill.family].icon}
                        </span>
                        <h3 className="text-[12px] font-medium text-[var(--text-primary)]">{skill.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleSkill(skill.id)}
                        className={`w-7 h-3.5 rounded-full relative transition-colors ${
                          skill.enabled ? 'bg-[var(--accent)]' : 'bg-white/[0.1]'
                        }`}
                      >
                        <span className={`absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          skill.enabled ? 'left-[14px]' : 'left-[2px]'
                        }`} />
                      </button>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-2">
                      {skill.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="tool-badge text-[var(--accent-text)]">
                          {actionClassLabels[skill.actionClass]}
                        </span>
                        {skill.creditCost > 0 && (
                          <span className="text-[var(--text-tertiary)]">{skill.creditCost} credit{skill.creditCost !== 1 ? 's' : ''}</span>
                        )}
                        {skill.targetStudio && (
                          <span className="text-[var(--text-tertiary)]">{skill.targetStudio}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRunSkill(skill)}
                        disabled={!skill.enabled || runningId === skill.id}
                        className="tool-btn text-[10px] text-[var(--accent-text)] disabled:opacity-30"
                      >
                        {runningId === skill.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Run
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Computer Mode Tab */}
          {activeTab === 'mode' && (
            <div className="space-y-3">
              {/* Mode selector */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(modeMeta) as [ComputerMode, typeof modeMeta.suggest][]).map(([mode, meta]) => (
                  <button
                    key={mode}
                    onClick={() => setComputerMode(mode)}
                    className={`rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
                      computerMode.activeMode === mode
                        ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5'
                        : 'border-[var(--border-default)] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={computerMode.activeMode === mode ? 'text-[var(--accent-text)]' : 'text-[var(--text-tertiary)]'}>
                        {meta.icon}
                      </span>
                      <span className="text-[12px] font-medium text-[var(--text-primary)]">{meta.label}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {meta.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Policy settings */}
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white/[0.02] p-3">
                <h3 className="text-[12px] font-medium text-[var(--text-primary)] mb-2">Execution Policy</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-[var(--text-secondary)]">Require approval for mutations</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">Scaffold and transform actions need human approval</p>
                    </div>
                    <div className={`w-7 h-3.5 rounded-full relative ${
                      computerMode.executionPolicy.requireApprovalForMutations ? 'bg-[var(--accent)]' : 'bg-white/[0.1]'
                    }`}>
                      <span className={`absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                        computerMode.executionPolicy.requireApprovalForMutations ? 'left-[14px]' : 'left-[2px]'
                      }`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-[var(--text-secondary)]">Max auto-actions per session</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">Limit autopilot actions before pausing for review</p>
                    </div>
                    <span className="tool-badge font-bold text-[var(--text-primary)]">
                      {computerMode.executionPolicy.maxAutoActions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action log */}
              {productActions.length > 0 && (
                <div>
                  <p className="tool-section-label">Action Log</p>
                  <div className="space-y-0.5">
                    {productActions.map((action) => (
                      <div key={action.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] bg-white/[0.01] border border-[var(--border-subtle)]">
                        {action.status === 'executed' ? (
                          <CheckCircle2 className="w-3 h-3 text-[var(--color-success)] shrink-0" />
                        ) : action.status === 'rejected' ? (
                          <AlertCircle className="w-3 h-3 text-[var(--color-error)] shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 text-[var(--color-warning)] shrink-0" />
                        )}
                        <span className="text-[11px] text-[var(--text-secondary)] flex-1">{action.action}</span>
                        <span className="tool-badge">{action.type}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
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
            <div className="space-y-1.5">
              {recentExecs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Brain className="w-5 h-5 text-[var(--text-tertiary)]" />
                  <p className="text-[12px] text-[var(--text-secondary)]">No skill executions yet</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Run a skill from the Skills tab to see history.</p>
                </div>
              ) : (
                recentExecs.map((exec) => {
                  const skill = skills.find((s) => s.id === exec.skillId)
                  return (
                    <div
                      key={exec.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {exec.status === 'running' ? (
                            <Loader2 className="w-3 h-3 text-[var(--color-info)] animate-spin" />
                          ) : exec.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-[var(--color-error)]" />
                          )}
                          <span className="text-[12px] font-medium text-[var(--text-primary)]">
                            {skill?.name ?? exec.skillId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                          <span className="tool-badge">
                            {modeMeta[exec.mode].label}
                          </span>
                          {exec.artifactsCreated > 0 && (
                            <span>{exec.artifactsCreated} artifact{exec.artifactsCreated !== 1 ? 's' : ''}</span>
                          )}
                          <span>{new Date(exec.startedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      {exec.error && (
                        <p className="text-[11px] text-[var(--color-error)] mt-1">{exec.error}</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
