import Link from 'next/link'
import { Wordmark } from '@product-os/ui'
import { signupMode } from '@ground/core/server'
import { SignupForm } from './signup-form'

// The gate depends on runtime config, so this page cannot be prerendered.
export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const mode = signupMode()

  return (
    <main className="g-auth">
      <div className="g-auth-card">
        <Wordmark />

        {mode.kind === 'closed' ? (
          <>
            <h1 className="g-auth-title">Signups are closed</h1>
            <p className="g-auth-lede">
              Ground is not accepting new accounts at the moment. If you were expecting an invite,
              ask whoever sent you here.
            </p>
          </>
        ) : (
          <>
            <h1 className="g-auth-title">Start grounding</h1>
            <p className="g-auth-lede">
              One account, one product. You can add context the moment you are in.
            </p>
            <SignupForm inviteRequired={mode.kind === 'invite-required'} />
          </>
        )}

        <p className="g-auth-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
