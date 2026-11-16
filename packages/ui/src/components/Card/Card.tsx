import type { ReactNode } from 'react'
import { cx } from '../../utils'
import { SectionTitle } from '../SectionTitle'
import styles from './Card.module.css'

interface CardProps {
  title?: ReactNode
  hint?: ReactNode
  /** Right-aligned header content, e.g. a Badge or an IconButton. */
  actions?: ReactNode
  className?: string
  children?: ReactNode
}

/**
 * A bordered content group (nobs-fs-app's Settings group). The optional header is
 * title (SectionTitle, as on every surface) + hint + actions; the body is whatever you compose inside.
 */
export function Card(props: CardProps) {
  const { title, hint, actions, className, children } = props

  const hasHeader = title || hint || actions
  return (
    <div className={cx(styles.card, className)}>
      {hasHeader && (
        // Without a hint the title is one line: centre it on the actions.
        <div className={cx(styles.header, !hint && styles.centred)}>
          <div className={styles.heading}>
            {title && <SectionTitle>{title}</SectionTitle>}
            {hint && <p className={styles.hint}>{hint}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
