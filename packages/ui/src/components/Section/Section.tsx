import type { ReactNode } from 'react'
import { cx } from '../../utils'
import { SectionTitle } from '../SectionTitle'
import styles from './Section.module.css'

interface SectionProps {
  /** The section's title (SectionTitle: the same on every surface). */
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
          {label && <SectionTitle>{label}</SectionTitle>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
