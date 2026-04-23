'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  BarChart3,
  Bug,
  Palette,
  Code2,
  Server,
  ChevronRight,
  ChevronLeft,
  Building2,
  UserPlus,
  Plus,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import type { OrgRole } from '../../lib/role-config'
import { api } from '../../lib/trpc-client'
import { PlanModeStep, type PlanModePayload } from './_plan-mode/plan-mode-step'
import { usePlanModeStore } from '../../lib/plan-mode-store'

/* ------------------------------------------------------------------ */
/*  Role cards data                                                    */
/* ------------------------------------------------------------------ */

interface RoleOption {
  role: OrgRole
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const roleOptions: RoleOption[] = [
  { role: 'manager', label: 'Manager', description: 'Oversee planning, tasks, approvals, and releases', icon: <Briefcase size={22} />, color: '#3B82F6' },
  { role: 'business_analyst', label: 'Business Analyst', description: 'Analyze requirements and build canvases', icon: <BarChart3 size={22} />, color: '#8B5CF6' },
  { role: 'qa', label: 'QA Engineer', description: 'Manage testing, track bugs, and verify releases', icon: <Bug size={22} />, color: '#F59E0B' },
  { role: 'product_designer', label: 'Product Designer', description: 'Design brand, components, and pages', icon: <Palette size={22} />, color: '#EC4899' },
  { role: 'frontend_dev', label: 'Frontend Dev', description: 'Build components, pages, and code', icon: <Code2 size={22} />, color: '#06B6D4' },
  { role: 'backend_dev', label: 'Backend Dev', description: 'Build workflows, APIs, and integrations', icon: <Server size={22} />, color: '#10B981' },
]

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepRing({ index, current }: { index: number; current: number }) {
  const size = 36
  const r = 14
  const circumference = 2 * Math.PI * r
  const isDone = index < current
  const isActive = index === current

  // Arc fill: done=full, active=partial sweep, future=0
  const dash = isDone ? circumference : isActive ? circumference * 0.65 : 0
  const gap = circumference - dash

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isDone ? '#3B82F6' : isActive ? '#6398ff' : 'transparent'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          initial={false}
          animate={{ strokeDasharray: `${dash} ${gap}` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {/* Centre label */}
      <div className={`absolute inset-0 flex items-center justify-center text-[12px] font-semibold transition-colors
        ${isDone ? 'text-[#3B82F6]' : isActive ? 'text-[#6398ff]' : 'text-[#64748B]'}`}
      >
        {isDone ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : index + 1}
      </div>
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <StepRing index={i} current={current} />
          {i < total - 1 && (
            <motion.div
              className="h-px w-10"
              style={{ background: i < current ? '#3B82F6' : 'rgba(255,255,255,0.08)' }}
              animate={{ background: i < current ? '#3B82F6' : 'rgba(255,255,255,0.08)' }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Slide animation variants                                           */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    filter: 'blur(4px)',
  }),
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // Step 1 state
  const [displayName, setDisplayName] = useState(user?.name ?? '')
  const [jobTitle, setJobTitle] = useState('')
  const [selectedRole, setSelectedRole] = useState<OrgRole | null>(null)

  // Step 2 state
  const [orgName, setOrgName] = useState('')
  const [orgMode, setOrgMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  const [teamSize, setTeamSize] = useState<string>('2-5')

  // Step 3 is now Plan Mode (multi-phase). Captured payload is stored locally
  // and consumed by handleComplete below.
  const [planPayload, setPlanPayload] = useState<PlanModePayload | null>(null)
  const resetPlan = usePlanModeStore((s) => s.reset)

  const orgSlug = useMemo(
    () =>
      orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    [orgName],
  )

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
      : (parts[0]?.[0] ?? '?').toUpperCase()
  }, [displayName])

  function goNext() {
    if (step < 2) {
      setDirection(1)
      setStep((s) => s + 1)
    }
    // Step 3 (Plan Mode) handles its own completion via onComplete callback.
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  async function handleComplete(payload: PlanModePayload) {
    const token = localStorage.getItem('product-os-session-token') ?? ''
    const finalOrgName = orgMode === 'create' ? (orgName || 'My Organization') : 'My Organization'
    const finalOrgSlug = orgMode === 'create'
      ? (orgSlug || (user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? 'my-org'))
      : (user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? 'my-org')

    let realOrgId = ''
    let realOrgSlug = finalOrgSlug

    try {
      const res = await fetch('/api/trpc/auth.createOrg', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { token, name: finalOrgName, slug: finalOrgSlug } }),
      })
      const json = await res.json()
      const data = json.result?.data?.json ?? json.result?.data
      if (data?.id) {
        realOrgId = data.id
        realOrgSlug = data.slug
        localStorage.setItem('product-os-org-id', realOrgId)
      }
    } catch {
      // Fallback: proceed without DB org
    }

    // Product name derived from Plan Mode summary or template
    const rawName = payload.summary.oneLiner?.trim()?.split(/[:\-–—]/)[0]?.trim().slice(0, 60)
      || payload.selectedTemplateId
      || 'My Product'
    const rawSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const rawDescription = payload.summary.oneLiner

    let productSlug = ''
    let productId = ''
    if (realOrgId) {
      try {
        const created = await api.product.create.mutate({
          name: rawName,
          slug: rawSlug,
          description: rawDescription,
        })
        productSlug = created.slug
        productId = created.id
      } catch {
        // best-effort
      }
    }

    // Start a Plan Mode session row + persist answers (best-effort — does not block completion)
    if (productId) {
      try {
        const session = await api.planMode.start.mutate({ productId })
        await api.planMode.answer.mutate({ sessionId: session.id, questionKey: 'freeform', answer: payload.freeform })
        await api.planMode.answer.mutate({ sessionId: session.id, questionKey: 'mcq', answer: payload.mcq })
        await api.planMode.saveArtifact.mutate({ sessionId: session.id, kind: 'summary', payload: payload.summary as any })
        await api.planMode.saveArtifact.mutate({ sessionId: session.id, kind: 'invitees', payload: { invitees: payload.invitees } })
        await api.planMode.finalize.mutate({ sessionId: session.id })
      } catch {
        // non-blocking
      }
    }

    updateUser({
      name: displayName,
      role: selectedRole ?? 'manager',
      orgId: realOrgId,
      orgName: finalOrgName,
      orgSlug: realOrgSlug,
      onboarded: true,
    })

    localStorage.setItem(
      'product-os-onboarding',
      JSON.stringify({
        jobTitle,
        orgMode,
        inviteCode: orgMode === 'join' ? inviteCode : undefined,
        teamSize,
        planMode: {
          templateId: payload.selectedTemplateId,
          autopilotTasks: payload.autopilotTasks,
          inviteeCount: payload.invitees.length,
        },
      }),
    )

    resetPlan()

    if (productSlug && realOrgSlug) {
      router.push(`/${realOrgSlug}/${productSlug}`)
    } else {
      router.push('/')
    }
  }

  async function handleSkip() {
    const token = localStorage.getItem('product-os-session-token') ?? ''
    const defaultSlug = user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? 'my-org'
    const defaultName = 'My Organization'

    let realOrgId = ''
    let realOrgSlug = defaultSlug

    try {
      const res = await fetch('/api/trpc/auth.createOrg', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { token, name: defaultName, slug: defaultSlug } }),
      })
      const json = await res.json()
      const data = json.result?.data?.json ?? json.result?.data
      if (data?.id) {
        realOrgId = data.id
        realOrgSlug = data.slug
        localStorage.setItem('product-os-org-id', realOrgId)
      }
    } catch {
      // best-effort
    }

    updateUser({
      role: selectedRole ?? 'manager',
      orgId: realOrgId,
      orgName: defaultName,
      orgSlug: realOrgSlug,
      onboarded: true,
    })
    router.push(realOrgSlug ? `/${realOrgSlug}` : '/')
  }

  const canProceed = (() => {
    if (step === 0) return displayName.trim().length > 0 && selectedRole !== null
    if (step === 1) {
      if (orgMode === 'create') return orgName.trim().length > 0
      return inviteCode.trim().length > 0
    }
    if (step === 2) {
      // Plan Mode owns its own internal completion via onComplete
      return false
    }
    return true
  })()

  const stepLabels = ['Your Profile', 'Your Organization', 'Plan Mode']

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl"
    >
      <div
        className="rounded-2xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-2xl p-8"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center"
            style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="8" r="3" fill="#3B82F6" />
              <circle cx="8" cy="22" r="3" fill="#8B5CF6" />
              <circle cx="24" cy="22" r="3" fill="#06B6D4" />
              <line x1="16" y1="11" x2="8" y2="19" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
              <line x1="16" y1="11" x2="24" y2="19" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
              <line x1="11" y1="22" x2="21" y2="22" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
            </svg>
          </div>

          <StepIndicator current={step} total={3} />

          <div className="text-center">
            <h1 className="text-xl font-semibold text-[#F1F5F9]">{stepLabels[step]}</h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              {step === 0 && 'Tell us about yourself'}
              {step === 1 && 'Set up your workspace'}
              {step === 2 && 'Tell us about your product — AI scaffolds the rest'}
            </p>
          </div>
        </div>

        {/* Step content */}
        <div className="relative min-h-[340px]">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ---------- Step 1: Profile ---------- */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                {/* Avatar + display name row */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-lg font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[#64748B] mb-1 block">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 transition"
                    />
                  </div>
                </div>

                {/* Job title */}
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 transition"
                  />
                </div>

                {/* Role selection */}
                <div>
                  <label className="text-xs text-[#64748B] mb-2 block">Your Role</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {roleOptions.map((opt) => {
                      const isSelected = selectedRole === opt.role
                      return (
                        <motion.button
                          key={opt.role}
                          type="button"
                          onClick={() => setSelectedRole(opt.role)}
                          whileHover={{
                            scale: 1.02,
                            borderColor: `${opt.color}55`,
                            boxShadow: `0 0 16px ${opt.color}18`,
                          }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                            isSelected
                              ? 'border-[#8B5CF6]/60 bg-[#8B5CF6]/10'
                              : 'border-white/[0.08] bg-white/[0.02]'
                          }`}
                          style={isSelected ? { borderColor: `${opt.color}60`, backgroundColor: `${opt.color}12` } : {}}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                          >
                            {opt.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#F1F5F9]">{opt.label}</p>
                            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{opt.description}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---------- Step 2: Organization ---------- */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                {/* Create / Join toggle */}
                <div className="flex gap-2 p-1 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setOrgMode('create')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      orgMode === 'create' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Plus size={14} />
                    Create new org
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrgMode('join')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      orgMode === 'join' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <UserPlus size={14} />
                    Join existing org
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {orgMode === 'create' ? (
                    <motion.div
                      key="create"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="text-xs text-[#64748B] mb-1 block">Organization Name</label>
                        <div className="relative">
                          <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                          <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="Acme Inc"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 transition"
                          />
                        </div>
                        {orgSlug && (
                          <p className="text-xs text-[#64748B] mt-1.5 ml-1">
                            Slug: <span className="text-[#94A3B8] font-mono">{orgSlug}</span>
                          </p>
                        )}
                      </div>

                      {/* Team size */}
                      <div>
                        <label className="text-xs text-[#64748B] mb-2 block">Team Size</label>
                        <div className="flex gap-2">
                          {['Just me', '2-5', '6-20', '20+'].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setTeamSize(size)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                teamSize === size
                                  ? 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]'
                                  : 'border-white/[0.08] bg-white/[0.02] text-[#94A3B8] hover:bg-white/[0.04]'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="join"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label className="text-xs text-[#64748B] mb-1 block">Invite Code</label>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="Enter your invite code"
                          className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/50 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/30 transition font-mono tracking-wider"
                        />
                        <p className="text-xs text-[#64748B] mt-1.5 ml-1">Ask your team admin for the invite code</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ---------- Step 3: Plan Mode ---------- */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <PlanModeStep
                  defaultProductName={orgName}
                  onComplete={(p) => { setPlanPayload(p); void handleComplete(p) }}
                  onSkip={handleSkip}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              step === 0
                ? 'text-[#64748B]/40 cursor-not-allowed'
                : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F1F5F9]'
            }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step !== 2 ? (
            <motion.button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              whileHover={canProceed ? { scale: 1.02 } : {}}
              whileTap={canProceed ? { scale: 0.98 } : {}}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                canProceed
                  ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                  : 'bg-white/[0.06] text-[#64748B] cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight size={16} />
            </motion.button>
          ) : (
            <span className="text-xs text-[#64748B]">Plan Mode controls completion</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
