'use client'

import { useActionState, useState } from 'react'
import { Button, Field, Input, Textarea } from '@product-os/ui'
import { KIND_LIST, KINDS, type EntryKind } from '@ground/core'
import { createEntry, type EntryFormState } from '../../actions/entries'

export function EntryForm({ onDone }: { onDone?: () => void }) {
  const [kind, setKind] = useState<EntryKind>('decision')
  const [state, action, pending] = useActionState<EntryFormState, FormData>(
    async (prev, formData) => {
      const result = await createEntry(prev, formData)
      if (result.ok) onDone?.()
      return result
    },
    {},
  )

  const spec = KINDS[kind]

  return (
    <form action={action} className="g-entryform">
      <fieldset className="g-kindpicker">
        <legend className="g-kindpicker-legend">Type</legend>
        <div className="g-kindpicker-row">
          {KIND_LIST.map((k) => (
            <label key={k.kind} className="g-kindchip" data-active={k.kind === kind || undefined}>
              <input
                type="radio"
                name="kind"
                value={k.kind}
                checked={k.kind === kind}
                onChange={() => setKind(k.kind)}
              />
              {k.label}
            </label>
          ))}
        </div>
        <p className="g-kindpicker-purpose">{spec.purpose}</p>
      </fieldset>

      <Field label="Title">
        {(props) => (
          <Input {...props} name="title" placeholder="Billing retries cap at three attempts" required />
        )}
      </Field>

      {/* The type supplies the fields. Structure is the entry, not decoration. */}
      {spec.fields.map((field) => (
        <Field key={field.key} label={field.label} required={field.required}>
          {(props) => (
            <Input
              {...props}
              name={`field.${field.key}`}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}
        </Field>
      ))}

      <Field label="Notes" hint="Optional. Keep it short — long prose is what rots.">
        {(props) => <Textarea {...props} name="body" rows={3} />}
      </Field>

      {state.error ? (
        <p role="alert" className="g-auth-error">
          {state.error}
        </p>
      ) : null}

      <div className="g-entryform-actions">
        <Button type="submit" variant="primary" loading={pending}>
          {pending ? 'Saving…' : 'Add entry'}
        </Button>
      </div>
    </form>
  )
}
