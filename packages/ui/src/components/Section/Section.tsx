import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './Section.module.css'

interface SectionProps {
  /** Small uppercase heading, as on nobs-fs-app's page sections. */
  label?: string
  /** Right-aligned header content (e.g. a status badge or action buttons). */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * A labelled panel surface. Owns background + radius; put the body in `SectionContent`
 * (padded) and edge-to-edge content in `SectionMedia`.
 */
export function Section(props: SectionProps) {
  const { label, actions, className, children } = props

  return (
    <section className={cx(styles.section, className)}>
      {(label || actions) && (
        <header className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
