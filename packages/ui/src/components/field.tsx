'use client'

import { useId } from 'react'
import { cn } from '../lib/utils'

export interface FieldProps {
  label: string
  /** Guidance shown under the label, before the control. */
  hint?: string
  /** Error text. Presence switches the field into its invalid state. */
  error?: string
  required?: boolean
  className?: string
  children: (props: { id: string; 'aria-describedby'?: string }) => React.ReactNode
}

/**
 * Label + control + message, wired for accessibility.
 * The control is a render prop so the caller keeps full control of it.
 */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className={cn('g-field', className)}>
      <label htmlFor={id} className="g-field-label">
        {label}
        {required ? <span aria-hidden="true" className="g-field-required">*</span> : null}
      </label>
      {children({ id, 'aria-describedby': message ? messageId : undefined })}
      {message ? (
        <p id={messageId} data-error={error ? true : undefined} className="g-field-message">
          {message}
        </p>
      ) : null}
    </div>
  )
}
