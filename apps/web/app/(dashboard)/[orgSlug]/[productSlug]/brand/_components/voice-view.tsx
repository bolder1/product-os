'use client'

/**
 * R5 — Brand · Voice view.
 *
 * Extracted from `/brand/voice`. All personality / tone / dos-donts / sample /
 * live-preview surfaces live here as a view that the unified Brand shell hosts.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Plus, X, RefreshCw, MessageSquare, Volume2, Shield, Lightbulb, Loader2, Check,
} from 'lucide-react'
import { useBrandVoiceStore, type BrandVoice, type TonePair, DEFAULT_VOICE } from '../../../../../lib/brand-voice-store'

const PRODUCT_ID = 'current'

const PERSONALITY_SUGGESTIONS = [
  'Clear', 'Confident', 'Human', 'Bold', 'Playful', 'Empathetic',
  'Technical', 'Friendly', 'Direct', 'Inspiring', 'Trustworthy', 'Witty',
]

const SAMPLE_CONTEXTS = ['welcome', 'error', 'success', 'empty state', 'onboarding', 'notification']

function ToneSlider({ pair, onChange }: { pair: TonePair; onChange: (value: number) => void }) {
  const [left, right] = pair.axis.split('↔')
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <span className="capitalize">{left}</span>
        <span className="text-[var(--text-primary)] font-medium tabular-nums">{pair.value}</span>
        <span className="capitalize">{right}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={0} max={100} value={pair.value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #8B5CF6 ${pair.value}%, rgba(255,255,255,0.08) ${pair.value}%)` }}
        />
      </div>
    </div>
  )
}

function EditableList({
  items, onChange, placeholder, color = '#10B981',
}: {
  items: string[]; onChange: (items: string[]) => void; placeholder: string; color?: string
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
          <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: `${color}15`, color }}>
            {item}
            <button onClick={() => onChange(items.filter((i) => i !== item))} className="opacity-60 hover:opacity-100 transition-opacity">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-white/[0.14] focus:outline-none transition text-xs"
        />
        <button onClick={add} disabled={!draft.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] text-[var(--text-secondary)] hover:bg-white/[0.04] disabled:opacity-40 transition-colors">
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}

function SamplePhrase({
  phrase, onUpdate, onRemove,
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
        <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wide">{phrase.context}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setDraft(phrase.text); setEditing(true) }}
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-1.5 py-0.5 rounded transition-colors">Edit</button>
          <button onClick={onRemove} className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors"><X size={12} /></button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
            className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.10] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50 resize-none transition" />
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Cancel</button>
            <button onClick={() => { onUpdate({ ...phrase, text: draft.trim() }); setEditing(false) }}
              className="text-xs px-2 py-1 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">"{phrase.text}"</p>
      )}
    </div>
  )
}

function LivePreview({ voice }: { voice: BrandVoice }) {
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState('welcome')
  const [preview, setPreview] = useState<string | null>(null)
  async function generate() {
    setGenerating(true); setPreview(null)
    await new Promise((r) => setTimeout(r, 1000))
    const toneMap = Object.fromEntries(voice.tonePairs.map((t) => [t.axis.split('↔')[0], t.value]))
    const casual = (toneMap['formal'] ?? 50) > 50
    const playful = (toneMap['serious'] ?? 50) > 50
    const bold = (toneMap['reserved'] ?? 50) > 50
    const samples: Record<string, string> = {
      welcome: casual ? `Hey! You're in. Let's build something ${bold ? 'amazing' : 'great'} together.`
        : `Welcome aboard. Your workspace is ready — let's get you set up.`,
      error: playful ? `Oops! Something broke on our end. ${bold ? "We\u2019re on it \u2014 hang tight." : 'Give it a moment and try again.'}`
        : `An error occurred. Please try again or contact support if the issue persists.`,
      success: bold ? `Done! That went perfectly.` : `Your changes have been saved successfully.`,
      'empty state': casual ? `Nothing here yet — ${bold ? 'go make something happen!' : 'add your first item to get started.'}`
        : `No items found. Create your first entry to begin.`,
      onboarding: playful ? `${bold ? 'Quick question' : 'Before we dive in'} — tell us a bit about yourself!`
        : `Let's personalise your experience. This takes about 2 minutes.`,
      notification: casual ? `Heads up! ${bold ? 'Something needs your attention.' : 'You have a new update.'}`
        : `You have a new notification that requires your review.`,
    }
    setPreview(samples[context] ?? `Sample text for "${context}" context.`)
    setGenerating(false)
  }
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center"><Sparkles size={14} className="text-[var(--accent)]" /></div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Live Preview</p>
            <p className="text-xs text-[var(--text-tertiary)]">AI generates a sample using your current settings</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {SAMPLE_CONTEXTS.map((ctx) => (
          <button key={ctx} onClick={() => { setContext(ctx); setPreview(null) }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
              context === ctx ? 'bg-[var(--accent)] text-white' : 'bg-white/[0.04] text-[var(--text-tertiary)] hover:bg-white/[0.07] hover:text-[var(--text-secondary)]'
            }`}>{ctx}</button>
        ))}
      </div>
      <button onClick={generate} disabled={generating}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors mb-3 ${
          generating ? 'bg-white/[0.04] text-[var(--text-tertiary)] cursor-not-allowed' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]'
        }`}>
        {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {generating ? 'Generating…' : 'Generate Sample'}
      </button>
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/05 px-4 py-3">
            <p className="text-xs text-[var(--text-tertiary)] mb-1 uppercase tracking-wide font-semibold">{context}</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">"{preview}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function VoiceView() {
  const getVoice = useBrandVoiceStore((s) => s.getVoice)
  const patchVoice = useBrandVoiceStore((s) => s.patchVoice)
  const voice = getVoice(PRODUCT_ID)
  const [saved, setSaved] = useState(false)

  function patch(p: Partial<BrandVoice>) { patchVoice(PRODUCT_ID, p) }
  function updateTone(axis: string, value: number) {
    patch({ tonePairs: voice.tonePairs.map((t) => t.axis === axis ? { ...t, value } : t) })
  }
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000) }
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
      {/* Actions strip */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-white/[0.06]">
        <button onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition-colors">
          <RefreshCw size={12} />Reset defaults
        </button>
        <motion.button onClick={handleSave} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            saved ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]'
          }`}>
          {saved ? <Check size={12} /> : <Sparkles size={12} />}
          {saved ? 'Saved' : 'Save Voice'}
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                  <MessageSquare size={14} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Personality</p>
                  <p className="text-xs text-[var(--text-tertiary)]">3 adjectives that define your brand's character</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {voice.personality.map((adj) => (
                  <motion.span key={adj} layout
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                    {adj}
                    <button onClick={() => patch({ personality: voice.personality.filter((p) => p !== adj) })}
                      className="opacity-60 hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </motion.span>
                ))}
                {voice.personality.length < 4 && (
                  <span className="text-xs text-[var(--text-tertiary)] flex items-center px-2">
                    {3 - voice.personality.length} more recommended
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-tertiary)] mb-2 uppercase tracking-wide font-semibold">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {personalityLeft.slice(0, 8).map((s) => (
                    <button key={s}
                      onClick={() => { if (voice.personality.length < 4) patch({ personality: [...voice.personality, s] }) }}
                      disabled={voice.personality.length >= 4}
                      className="px-2.5 py-1 rounded-lg text-xs text-[var(--text-tertiary)] bg-white/[0.04] border border-white/[0.06] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] hover:border-[var(--accent)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                  <Volume2 size={14} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Tone Spectrum</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Drag to set where you sit on each axis (0–100)</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {voice.tonePairs.map((pair) => (
                  <ToneSlider key={pair.axis} pair={pair} onChange={(v) => updateTone(pair.axis, v)} />
                ))}
              </div>
            </section>

            <LivePreview voice={voice} />
          </div>

          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-success)]/15 flex items-center justify-center">
                  <Lightbulb size={14} className="text-[var(--color-success)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Do's</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Writing patterns to follow</p>
                </div>
              </div>
              <EditableList items={voice.dos} onChange={(dos) => patch({ dos })} placeholder="Add a writing rule…" color="#10B981" />
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-error)]/15 flex items-center justify-center">
                  <Shield size={14} className="text-[var(--color-error)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Don'ts</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Patterns to avoid in all copy</p>
                </div>
              </div>
              <EditableList items={voice.donts} onChange={(donts) => patch({ donts })} placeholder="Add something to avoid…" color="#EF4444" />
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-warning)]/15 flex items-center justify-center">
                  <X size={14} className="text-[var(--color-warning)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Forbidden Words</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Words that should never appear in copy</p>
                </div>
              </div>
              <EditableList items={voice.forbiddenWords} onChange={(forbiddenWords) => patch({ forbiddenWords })} placeholder="synergy, leverage, utilize…" color="#F59E0B" />
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                    <MessageSquare size={14} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Sample Phrases</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Reference copy for each context</p>
                  </div>
                </div>
                <button
                  onClick={() => patch({
                    samplePhrases: [
                      ...voice.samplePhrases,
                      { context: SAMPLE_CONTEXTS.find((c) => !voice.samplePhrases.find((p) => p.context === c)) ?? 'custom', text: 'Your phrase here.' },
                    ],
                  })}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-secondary)] border border-white/[0.06] transition-colors">
                  <Plus size={11} />Add
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {voice.samplePhrases.map((phrase, i) => (
                  <SamplePhrase key={i} phrase={phrase}
                    onUpdate={(updated) => { const next = [...voice.samplePhrases]; next[i] = updated; patch({ samplePhrases: next }) }}
                    onRemove={() => patch({ samplePhrases: voice.samplePhrases.filter((_, j) => j !== i) })} />
                ))}
              </div>
            </section>

            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-[var(--text-tertiary)]">Voice version</span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs font-mono text-[var(--text-secondary)]">v{voice.version}</span>
              <span className="text-xs text-[var(--text-tertiary)]">· Last updated {new Date(voice.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
