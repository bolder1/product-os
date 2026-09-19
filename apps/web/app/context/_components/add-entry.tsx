'use client'

import { useState } from 'react'
import { Button } from '@product-os/ui'
import { EntryForm } from './entry-form'

export function AddEntry() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add context
      </Button>
    )
  }

  return (
    <div className="g-addentry">
      <div className="g-addentry-head">
        <h2 className="g-addentry-title">New entry</h2>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <EntryForm onDone={() => setOpen(false)} />
    </div>
  )
}
