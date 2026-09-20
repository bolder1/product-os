'use client'

import { cn } from '../lib/utils'

export interface EmptyProps {
  title: string
  /** One sentence on what to do next — never just "no data". */
  description: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function Empty({ title, description, action, icon, className }: EmptyProps) {
  return (
    <div className={cn('g-empty', className)}>
      {icon ? <div className="g-empty-icon" aria-hidden="true">{icon}</div> : null}
      <h3 className="g-empty-title">{title}</h3>
      <p className="g-empty-description">{description}</p>
      {action ? <div className="g-empty-action">{action}</div> : null}
    </div>
  )
}
