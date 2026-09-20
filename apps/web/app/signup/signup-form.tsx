'use client'

import { useActionState } from 'react'
import { Button, Field, Input } from '@product-os/ui'
import { signUp, type FormState } from '../actions/auth'

export function SignupForm({ inviteRequired }: { inviteRequired: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {})

  return (
    <form action={action} className="g-auth-form">
      {inviteRequired ? (
        <Field label="Invite code" hint="Ground is invite-only while it is early." required>
          {(props) => <Input {...props} name="invite" autoComplete="off" mono required />}
        </Field>
      ) : null}

      <Field label="What are you building?" hint="The product your agents keep getting wrong.">
        {(props) => <Input {...props} name="product" placeholder="Acme Billing" required />}
      </Field>
      <Field label="Email">
        {(props) => <Input {...props} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        {(props) => (
          <Input {...props} name="password" type="password" autoComplete="new-password" required />
        )}
      </Field>

      {state.error ? (
        <p role="alert" className="g-auth-error">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" loading={pending}>
        {pending ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  )
}
