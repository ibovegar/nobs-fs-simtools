import type { ReactNode } from 'react'
import { cx } from '../../utils'
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
 * title + hint + actions; the body is whatever you compose inside.
 */
export function Card(props: CardProps) {
  const { title, hint, actions, className, children } = props

  const hasHeader = title || hint || actions
  return (
    <div className={cx(styles.card, className)}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.heading}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {hint && <p className={styles.hint}>{hint}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
