'use client'

import { useState } from 'react'
import { Button } from '@product-os/ui'

export function ConnectPanel({ command, connected }: { command: string; connected: boolean }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the command is selectable either way.
      setCopied(false)
    }
  }

  return (
    <section className="g-connect" aria-labelledby="connect-heading">
      <div className="g-connect-head">
        <h2 id="connect-heading" className="g-connect-title">
          Connect your agent
        </h2>
        <span className="g-badge" data-tone={connected ? 'grounded' : 'neutral'}>
          <span aria-hidden="true" className="g-badge-dot" />
          {connected ? 'Connected' : 'Not connected yet'}
        </span>
      </div>

      <p className="g-connect-lede">
        Run this once. Every agent on your machine can then read this product&rsquo;s context before it
        writes anything.
      </p>

      <div className="g-connect-command">
        <code>{command}</code>
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </section>
  )
}
