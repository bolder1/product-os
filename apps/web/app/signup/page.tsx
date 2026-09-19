'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Field, Input, Wordmark } from '@product-os/ui'
import { signUp, type FormState } from '../actions/auth'

export default function SignupPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {})

  return (
    <main className="g-auth">
      <div className="g-auth-card">
        <Wordmark />
        <h1 className="g-auth-title">Start grounding</h1>
        <p className="g-auth-lede">
          One account, one product. You can add context the moment you are in.
        </p>

        <form action={action} className="g-auth-form">
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

        <p className="g-auth-alt">
          Already have one? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
