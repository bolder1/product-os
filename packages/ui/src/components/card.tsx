'use client'

import { cn } from '../lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'flat' sits on the canvas with a line; 'raised' lifts off it. */
  tone?: 'flat' | 'raised'
  interactive?: boolean
}

export function Card({ tone = 'flat', interactive, className, ...props }: CardProps) {
  return (
    <div
      data-tone={tone}
      data-interactive={interactive || undefined}
      className={cn('g-card', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('g-card-header', className)} {...props} />
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('g-card-body', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('g-card-footer', className)} {...props} />
}
