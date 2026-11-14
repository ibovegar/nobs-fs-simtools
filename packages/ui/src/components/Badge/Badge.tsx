import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './Badge.module.css'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  tone?: BadgeTone
  /** Leading status dot (nobs-fs-app's ConnectionIndicator). */
  dot?: boolean
  /** Pulse the dot to signal a live / active state. */
  pulse?: boolean
  className?: string
  children: ReactNode
}

/** Small monospace status pill. */
export function Badge(props: BadgeProps) {
  const { tone = 'neutral', dot = false, pulse = false, className, children } = props

  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {dot && <span className={cx(styles.dot, pulse && styles.pulse)} aria-hidden="true" />}
      {children}
    </span>
  )
}
