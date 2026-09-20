'use server'

import { revalidatePath } from 'next/cache'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, entries, KINDS, type EntryKind } from '@ground/core/server'
import { requireWorkspace } from '../_lib/session'

export interface EntryFormState {
  error?: string
  ok?: boolean
}

const kindValues = Object.keys(KINDS) as [EntryKind, ...EntryKind[]]

const entryInput = z.object({
  kind: z.enum(kindValues),
  title: z.string().min(1, 'Give the entry a title.').max(200),
  body: z.string().max(4000).default(''),
})

/** Pulls the kind's declared fields out of the form, enforcing the required ones. */
function readFields(kind: EntryKind, formData: FormData) {
  const spec = KINDS[kind]
  const fields: Record<string, string> = {}
  for (const field of spec.fields) {
    const value = String(formData.get(`field.${field.key}`) ?? '').trim()
    if (field.required && !value) {
      return { error: `${spec.label} needs “${field.label}”.` as string, fields: null }
    }
    if (value) fields[field.key] = value
  }
  return { error: null, fields }
}

export async function createEntry(_prev: EntryFormState, formData: FormData): Promise<EntryFormState> {
  const { workspace } = await requireWorkspace()

  const parsed = entryInput.safeParse({
    kind: formData.get('kind'),
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { error, fields } = readFields(parsed.data.kind, formData)
  if (error) return { error }

  await db.insert(entries).values({
    workspaceId: workspace.id,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body,
    fields: fields ?? {},
  })

  revalidatePath('/context')
  return { ok: true }
}

export async function updateEntry(_prev: EntryFormState, formData: FormData): Promise<EntryFormState> {
  const { workspace } = await requireWorkspace()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing entry.' }

  const parsed = entryInput.safeParse({
    kind: formData.get('kind'),
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { error, fields } = readFields(parsed.data.kind, formData)
  if (error) return { error }

  await db
    .update(entries)
    .set({
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body,
      fields: fields ?? {},
      updatedAt: new Date(),
      // Editing an entry is an act of confirming it.
      lastConfirmedAt: new Date(),
    })
    .where(and(eq(entries.id, id), eq(entries.workspaceId, workspace.id)))

  revalidatePath('/context')
  return { ok: true }
}

/** Marks an entry still true, resetting its age. The cheapest way to clear drift. */
export async function confirmEntry(formData: FormData) {
  const { workspace } = await requireWorkspace()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await db
    .update(entries)
    .set({ lastConfirmedAt: new Date() })
    .where(and(eq(entries.id, id), eq(entries.workspaceId, workspace.id)))

  revalidatePath('/context')
}

export async function deleteEntry(formData: FormData) {
  const { workspace } = await requireWorkspace()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await db.delete(entries).where(and(eq(entries.id, id), eq(entries.workspaceId, workspace.id)))
  revalidatePath('/context')
}

export async function listEntries(workspaceId: string) {
  return db
    .select()
    .from(entries)
    .where(eq(entries.workspaceId, workspaceId))
    .orderBy(desc(entries.lastConfirmedAt))
}
