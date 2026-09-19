'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, Field, Input, Wordmark } from '@product-os/ui'
import { signIn, type FormState } from '../actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {})

  return (
    <main className="g-auth">
      <div className="g-auth-card">
        <Wordmark />
        <h1 className="g-auth-title">Sign in</h1>

        <form action={action} className="g-auth-form">
          <Field label="Email">
            {(props) => <Input {...props} name="email" type="email" autoComplete="email" required />}
          </Field>
          <Field label="Password">
            {(props) => (
              <Input {...props} name="password" type="password" autoComplete="current-password" required />
            )}
          </Field>

          {state.error ? (
            <p role="alert" className="g-auth-error">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" size="lg" loading={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="g-auth-alt">
          No account yet? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  )
}
