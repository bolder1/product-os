'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Plus,
  X,
  RefreshCw,
  ChevronRight,
  MessageSquare,
  Volume2,
  Shield,
  Lightbulb,
  Loader2,
  Check,
} from 'lucide-react'
import { useBrandVoiceStore, type BrandVoice, type TonePair, DEFAULT_VOICE } from '../../../../../lib/brand-voice-store'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const PRODUCT_ID = 'current' // In real app, use route params

const PERSONALITY_SUGGESTIONS = [
  'Clear', 'Confident', 'Human', 'Bold', 'Playful', 'Empathetic',
  'Technical', 'Friendly', 'Direct', 'Inspiring', 'Trustworthy', 'Witty',
]

const TONE_AXES: TonePair[] = [
  { axis: 'formal↔casual', value: 50 },
  { axis: 'serious↔playful', value: 50 },
  { axis: 'reserved↔bold', value: 50 },
  { axis: 'technical↔plain', value: 50 },
]

const SAMPLE_CONTEXTS = ['welcome', 'error', 'success', 'empty state', 'onboarding', 'notification']

// ---------------------------------------------------------------------------
// Tone slider
// ---------------------------------------------------------------------------

function ToneSlider({
  pair,
  onChange,
}: {
  pair: TonePair
  onChange: (value: number) => void
}) {
  const [left, right] = pair.axis.split('↔')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span className="capitalize">{left}</span>
        <span className="text-[#F1F5F9] font-medium tabular-nums">{pair.value}</span>
        <span className="capitalize">{right}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={pair.value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8B5CF6 ${pair.value}%, rgba(255,255,255,0.08) ${pair.value}%)`,
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editable list (dos / don'ts / forbidden)
// ---------------------------------------------------------------------------

function EditableList({
  items,
  onChange,
  placeholder,
  color = '#10B981',
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  color?: string
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const val = draft.trim()
    if (!val || items.includes(val)) return
    onChange([...items, val])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {item}
            <button
              onClick={() => onChange(items.filter((i) => i !== item))}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:border-white/[0.14] focus:outline-none transition text-xs"
        />
        <button
          onClick={add}
          disabled={!draft.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] text-[#94A3B8] hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sample phrase generator
// ---------------------------------------------------------------------------

function SamplePhrase({
  phrase,
  onUpdate,
  onRemove,
}: {
  phrase: { context: string; text: string }
  onUpdate: (p: { context: string; text: string }) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(phrase.text)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-[#8B5CF6] uppercase tracking-wide">{phrase.context}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setDraft(phrase.text); setEditing(true) }}
            className="text-[10px] text-[#64748B] hover:text-[#F1F5F9] px-1.5 py-0.5 rounded transition-colors"
          >
            Edit
          </button>
          <button onClick={onRemove} className="text-[#64748B] hover:text-[#EF4444] transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.10] text-xs text-[#F1F5F9] focus:outline-none focus:border-[#8B5CF6]/50 resize-none transition"
          />
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors">Cancel</button>
            <button
              onClick={() => { onUpdate({ ...phrase, text: draft.trim() }); setEditing(false) }}
              className="text-xs px-2 py-1 rounded-md bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#94A3B8] leading-relaxed italic">"{phrase.text}"</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Live preview
// ---------------------------------------------------------------------------

function LivePreview({ voice }: { voice: BrandVoice }) {
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState('welcome')
  const [preview, setPreview] = useState<string | null>(null)

  async function generate() {
    setGenerating(true)
    setPreview(null)
    await new Promise((r) => setTimeout(r, 1000))
    const toneMap = Object.fromEntries(voice.tonePairs.map((t) => [t.axis.split('↔')[0], t.value]))
    const casual = (toneMap['formal'] ?? 50) > 50
    const playful = (toneMap['serious'] ?? 50) > 50
    const bold = (toneMap['reserved'] ?? 50) > 50

    const samples: Record<string, string> = {
      welcome: casual
        ? `Hey! You're in. Let's build something ${bold ? 'amazing' : 'great'} together.`
        : `Welcome aboard. Your workspace is ready — let's get you set up.`,
      error: playful
        ? `Oops! Something broke on our end. ${bold ? "We\u2019re on it \u2014 hang tight." : 'Give it a moment and try again.'}`
        : `An error occurred. Please try again or contact support if the issue persists.`,
      success: bold
        ? `Done! That went perfectly.`
        : `Your changes have been saved successfully.`,
      'empty state': casual
        ? `Nothing here yet — ${bold ? 'go make something happen!' : 'add your first item to get started.'}`
        : `No items found. Create your first entry to begin.`,
      onboarding: playful
        ? `${bold ? 'Quick question' : 'Before we dive in'} — tell us a bit about yourself!`
        : `Let's personalise your experience. This takes about 2 minutes.`,
      notification: casual
        ? `Heads up! ${bold ? 'Something needs your attention.' : 'You have a new update.'}`
        : `You have a new notification that requires your review.`,
    }
    setPreview(samples[context] ?? `Sample text for "${context}" context.`)
    setGenerating(false)
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center">
            <Sparkles size={14} className="text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#F1F5F9]">Live Preview</p>
            <p className="text-xs text-[#64748B]">AI generates a sample using your current settings</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {SAMPLE_CONTEXTS.map((ctx) => (
          <button
            key={ctx}
            onClick={() => { setContext(ctx); setPreview(null) }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
              context === ctx
                ? 'bg-[#3B82F6] text-white'
                : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.07] hover:text-[#94A3B8]'
            }`}
          >
            {ctx}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={generating}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors mb-3 ${
          generating
            ? 'bg-white/[0.04] text-[#64748B] cursor-not-allowed'
            : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
        }`}
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {generating ? 'Generating…' : 'Generate Sample'}
      </button>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/05 px-4 py-3"
          >
            <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide font-semibold">{context}</p>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">"{preview}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BrandVoicePage() {
  const getVoice = useBrandVoiceStore((s) => s.getVoice)
  const patchVoice = useBrandVoiceStore((s) => s.patchVoice)

  const voice = getVoice(PRODUCT_ID)
  const [saved, setSaved] = useState(false)

  function patch(p: Partial<BrandVoice>) {
    patchVoice(PRODUCT_ID, p)
  }

  function updateTone(axis: string, value: number) {
    patch({
      tonePairs: voice.tonePairs.map((t) => t.axis === axis ? { ...t, value } : t),
    })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    patch({
      personality: DEFAULT_VOICE.personality,
      tonePairs: DEFAULT_VOICE.tonePairs,
      dos: DEFAULT_VOICE.dos,
      donts: DEFAULT_VOICE.donts,
      samplePhrases: DEFAULT_VOICE.samplePhrases,
      forbiddenWords: DEFAULT_VOICE.forbiddenWords,
    })
  }

  const personalityLeft = PERSONALITY_SUGGESTIONS.filter((s) => !voice.personality.includes(s))

  return (
    <div className="flex flex-col h-full bg-[#080C14]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <span className="text-[#94A3B8]">Brand</span>
          <ChevronRight size={12} />
          <span className="text-[#F1F5F9] font-medium">Voice</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04] transition-colors"
          >
            <RefreshCw size={12} />
            Reset defaults
          </button>
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              saved
                ? 'bg-[#10B981] text-white'
                : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
            }`}
          >
            {saved ? <Check size={12} /> : <Sparkles size={12} />}
            {saved ? 'Saved' : 'Save Voice'}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            {/* Personality */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#EC4899]/15 flex items-center justify-center">
                  <MessageSquare size={14} className="text-[#EC4899]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">Personality</p>
                  <p className="text-xs text-[#64748B]">3 adjectives that define your brand's character</p>
                </div>
              </div>

              {/* Selected */}
              <div className="flex flex-wrap gap-2 mb-3">
                {voice.personality.map((adj) => (
                  <motion.span
                    key={adj}
                    layout
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/20"
                  >
                    {adj}
                    <button
                      onClick={() => patch({ personality: voice.personality.filter((p) => p !== adj) })}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
                {voice.personality.length < 4 && (
                  <span className="text-xs text-[#64748B] flex items-center px-2">
                    {3 - voice.personality.length} more recommended
                  </span>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-[10px] text-[#64748B] mb-2 uppercase tracking-wide font-semibold">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {personalityLeft.slice(0, 8).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (voice.personality.length < 4) {
                          patch({ personality: [...voice.personality, s] })
                        }
                      }}
                      disabled={voice.personality.length >= 4}
                      className="px-2.5 py-1 rounded-lg text-xs text-[#64748B] bg-white/[0.04] border border-white/[0.06] hover:bg-[#EC4899]/10 hover:text-[#EC4899] hover:border-[#EC4899]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Tone sliders */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/15 flex items-center justify-center">
                  <Volume2 size={14} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">Tone Spectrum</p>
                  <p className="text-xs text-[#64748B]">Drag to set where you sit on each axis (0–100)</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {voice.tonePairs.map((pair) => (
                  <ToneSlider
                    key={pair.axis}
                    pair={pair}
                    onChange={(v) => updateTone(pair.axis, v)}
                  />
                ))}
              </div>
            </section>

            {/* Live Preview */}
            <LivePreview voice={voice} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            {/* Dos */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 flex items-center justify-center">
                  <Lightbulb size={14} className="text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">Do's</p>
                  <p className="text-xs text-[#64748B]">Writing patterns to follow</p>
                </div>
              </div>
              <EditableList
                items={voice.dos}
                onChange={(dos) => patch({ dos })}
                placeholder="Add a writing rule…"
                color="#10B981"
              />
            </section>

            {/* Don'ts */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#EF4444]/15 flex items-center justify-center">
                  <Shield size={14} className="text-[#EF4444]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">Don'ts</p>
                  <p className="text-xs text-[#64748B]">Patterns to avoid in all copy</p>
                </div>
              </div>
              <EditableList
                items={voice.donts}
                onChange={(donts) => patch({ donts })}
                placeholder="Add something to avoid…"
                color="#EF4444"
              />
            </section>

            {/* Forbidden words */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/15 flex items-center justify-center">
                  <X size={14} className="text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">Forbidden Words</p>
                  <p className="text-xs text-[#64748B]">Words that should never appear in copy</p>
                </div>
              </div>
              <EditableList
                items={voice.forbiddenWords}
                onChange={(forbiddenWords) => patch({ forbiddenWords })}
                placeholder="synergy, leverage, utilize…"
                color="#F59E0B"
              />
            </section>

            {/* Sample phrases */}
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/15 flex items-center justify-center">
                    <MessageSquare size={14} className="text-[#06B6D4]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F1F5F9]">Sample Phrases</p>
                    <p className="text-xs text-[#64748B]">Reference copy for each context</p>
                  </div>
                </div>
                <button
                  onClick={() => patch({
                    samplePhrases: [
                      ...voice.samplePhrases,
                      { context: SAMPLE_CONTEXTS.find((c) => !voice.samplePhrases.find((p) => p.context === c)) ?? 'custom', text: 'Your phrase here.' },
                    ],
                  })}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#64748B] hover:bg-white/[0.04] hover:text-[#94A3B8] border border-white/[0.06] transition-colors"
                >
                  <Plus size={11} />
                  Add
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {voice.samplePhrases.map((phrase, i) => (
                  <SamplePhrase
                    key={i}
                    phrase={phrase}
                    onUpdate={(updated) => {
                      const next = [...voice.samplePhrases]
                      next[i] = updated
                      patch({ samplePhrases: next })
                    }}
                    onRemove={() => patch({ samplePhrases: voice.samplePhrases.filter((_, j) => j !== i) })}
                  />
                ))}
              </div>
            </section>

            {/* Version badge */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-[#64748B]">Voice version</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs font-mono text-[#94A3B8]">
                v{voice.version}
              </span>
              <span className="text-xs text-[#64748B]">
                · Last updated {new Date(voice.updatedAt).toLocaleDateString()}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
