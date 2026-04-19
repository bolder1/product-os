'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Tag,
  Sparkles,
  CheckSquare,
  Square,
  Rocket,
  FileText,
  Plus,
  Minus,
  Pencil,
  ChevronDown,
} from 'lucide-react'
import { type Release, statusConfig, changeTypeConfig } from '../_data/mock-releases'

interface ReleaseDetailProps {
  release: Release
  onDeploy?: (releaseId: string, env: string) => void
}

const environments = ['Development', 'Staging', 'Production']

export function ReleaseDetail({ release, onDeploy }: ReleaseDetailProps) {
  const [selectedEnv, setSelectedEnv] = useState('Staging')
  const [envOpen, setEnvOpen] = useState(false)
  const status = statusConfig[release.status]

  const checklistItems = [
    { key: 'qa', label: 'QA Passed', done: release.checklist.qa },
    { key: 'stakeholder', label: 'Stakeholder Approved', done: release.checklist.stakeholder },
    { key: 'docs', label: 'Docs Updated', done: release.checklist.docs },
    { key: 'migration', label: 'Migration Tested', done: release.checklist.migration },
  ]

  const completedChecks = checklistItems.filter((c) => c.done).length

  const changeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="w-3 h-3" />
      case 'removed':
        return <Minus className="w-3 h-3" />
      default:
        return <Pencil className="w-3 h-3" />
    }
  }

  return (
    <motion.div
      key={release.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 h-full overflow-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#10B981]" />
              <span className="text-lg font-mono font-bold text-[#F1F5F9]">
                {release.version}
              </span>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              {status.label}
            </span>
          </div>
          <h2 className="text-sm text-[#94A3B8]">{release.title}</h2>
          <p className="text-xs text-[#64748B] mt-1">{release.date}</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          AI: Write release notes
        </button>
      </div>

      {/* Release notes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-3.5 h-3.5 text-[#64748B]" />
          <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
            Release Notes
          </h3>
        </div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <div className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
            {release.notes.split('\\n').map((line, i) => {
              if (line.startsWith('### ')) {
                return (
                  <h4 key={i} className="text-sm font-semibold text-[#F1F5F9] mt-3 mb-2 first:mt-0">
                    {line.replace('### ', '')}
                  </h4>
                )
              }
              if (line.startsWith('- **')) {
                const match = line.match(/- \*\*(.+?)\*\*: (.+)/)
                if (match) {
                  return (
                    <p key={i} className="ml-3 mb-1">
                      <span className="text-[#F1F5F9] font-medium">{match[1]}</span>
                      <span className="text-[#94A3B8]">: {match[2]}</span>
                    </p>
                  )
                }
              }
              if (line.startsWith('- ')) {
                return (
                  <p key={i} className="ml-3 mb-1 text-[#94A3B8]">
                    {line}
                  </p>
                )
              }
              return (
                <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
                  {line}
                </p>
              )
            })}
          </div>
        </div>
      </div>

      {/* Changes */}
      <div>
        <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
          Changes Included ({release.changes.length})
        </h3>
        <div className="space-y-1.5">
          {release.changes.map((change, i) => {
            const ct = changeTypeConfig[change.changeType]
            return (
              <motion.div
                key={`${change.name}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]"
              >
                <span style={{ color: ct.color }}>{changeIcon(change.changeType)}</span>
                <span className="text-xs text-[#F1F5F9] flex-1">{change.name}</span>
                <span className="text-[10px] text-[#64748B] bg-white/[0.05] px-1.5 py-0.5 rounded">
                  {change.type}
                </span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ color: ct.color, backgroundColor: `${ct.color}15` }}
                >
                  {ct.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
            Release Checklist
          </h3>
          <span className="text-[10px] text-[#64748B]">
            {completedChecks}/{checklistItems.length} completed
          </span>
        </div>
        <div className="space-y-1.5">
          {checklistItems.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
            >
              {item.done ? (
                <CheckSquare className="w-4 h-4 text-[#10B981]" />
              ) : (
                <Square className="w-4 h-4 text-[#64748B]" />
              )}
              <span
                className={`text-xs ${
                  item.done ? 'text-[#94A3B8]' : 'text-[#F1F5F9]'
                }`}
              >
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Deployment */}
      <div>
        <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
          Deployment
        </h3>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Environment selector */}
            <div className="relative flex-1">
              <button
                onClick={() => setEnvOpen(!envOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-[#F1F5F9] hover:border-white/[0.15] transition-colors"
              >
                <span>{selectedEnv}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${envOpen ? 'rotate-180' : ''}`} />
              </button>
              {envOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg border border-white/[0.08] bg-[#0a0f1e] z-10">
                  {environments.map((env) => (
                    <button
                      key={env}
                      onClick={() => {
                        setSelectedEnv(env)
                        setEnvOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        selectedEnv === env
                          ? 'text-[#10B981] bg-[#10B981]/10'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.03]'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onDeploy?.(release.id, selectedEnv)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#10B981] hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={release.status === 'production' || release.status === 'rolled-back'}
            >
              <Rocket className="w-3.5 h-3.5" />
              Deploy
            </button>
          </div>

          {/* Deployment log placeholder */}
          <div className="rounded-lg bg-[#060918] border border-white/[0.06] p-3 font-mono text-[10px] text-[#64748B] leading-5">
            <p>$ deploy --version {release.version} --env {selectedEnv.toLowerCase()}</p>
            {release.status === 'production' && (
              <>
                <p className="text-[#10B981]">[OK] Build passed</p>
                <p className="text-[#10B981]">[OK] Tests passed (142/142)</p>
                <p className="text-[#10B981]">[OK] Deployed to production</p>
                <p className="text-[#F1F5F9]">Release {release.version} is live</p>
              </>
            )}
            {release.status === 'staging' && (
              <>
                <p className="text-[#10B981]">[OK] Build passed</p>
                <p className="text-[#F59E0B]">[..] Running tests...</p>
              </>
            )}
            {release.status === 'draft' && (
              <p className="text-[#64748B]">Awaiting deployment...</p>
            )}
            {release.status === 'rolled-back' && (
              <>
                <p className="text-[#F43F5E]">[ERR] Performance degradation detected</p>
                <p className="text-[#F43F5E]">[ERR] Rolled back to previous version</p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
