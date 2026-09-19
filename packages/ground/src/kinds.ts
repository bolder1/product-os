import type { EntryKind } from './schema'

export interface FieldSpec {
  key: string
  label: string
  /** Placeholder doubles as the question the field is really asking. */
  placeholder: string
  required: boolean
}

export interface KindSpec {
  kind: EntryKind
  label: string
  /** One line explaining when to reach for this kind. */
  purpose: string
  fields: FieldSpec[]
}

/**
 * The type registry.
 *
 * Entries are typed and the type supplies required fields. Structure is not
 * scaffolding around prose — it is the entry. This is what a markdown file
 * cannot enforce, and it is what makes an entry answerable by an agent.
 */
export const KINDS: Record<EntryKind, KindSpec> = {
  decision: {
    kind: 'decision',
    label: 'Decision',
    purpose: 'A choice that is settled, so agents stop re-litigating it.',
    fields: [
      { key: 'chose', label: 'We chose', placeholder: 'Stripe for payments', required: true },
      { key: 'rejected', label: 'Over', placeholder: 'Adyen, Paddle', required: false },
      { key: 'because', label: 'Because', placeholder: 'Existing Connect integration', required: true },
    ],
  },
  constraint: {
    kind: 'constraint',
    label: 'Constraint',
    purpose: 'A rule the product must not break.',
    fields: [
      { key: 'rule', label: 'Rule', placeholder: 'No PII in application logs', required: true },
      { key: 'because', label: 'Because', placeholder: 'SOC 2 commitment', required: true },
    ],
  },
  convention: {
    kind: 'convention',
    label: 'Convention',
    purpose: 'How this codebase does a recurring thing.',
    fields: [
      { key: 'rule', label: 'Convention', placeholder: 'Server actions, not API routes', required: true },
      { key: 'example', label: 'Example', placeholder: 'app/actions/entries.ts', required: false },
    ],
  },
  glossary: {
    kind: 'glossary',
    label: 'Glossary',
    purpose: 'A term that means something specific here.',
    fields: [
      { key: 'term', label: 'Term', placeholder: 'Workspace', required: true },
      { key: 'means', label: 'Means', placeholder: 'One product’s context, owned by one account', required: true },
    ],
  },
  nongoal: {
    kind: 'nongoal',
    label: 'Non-goal',
    purpose: 'Something deliberately not built, so nobody builds it.',
    fields: [
      { key: 'notDoing', label: 'Not doing', placeholder: 'Team collaboration', required: true },
      { key: 'because', label: 'Because', placeholder: 'Single-player has to work first', required: true },
    ],
  },
}

export const KIND_LIST = Object.values(KINDS)
