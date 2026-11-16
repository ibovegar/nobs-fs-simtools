import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './SectionTitle.module.css'

interface SectionTitleProps {
  /** The element to render: a heading by default, a span inside another control. */
  component?: 'h2' | 'h3' | 'span'
  className?: string
  children?: ReactNode
}

/**
 * The one title style for every surface: a large, semibold heading. `Section`,
 * `Card` and `Disclosure` render their titles with it, so all section titles look the
 * same; use it for a heading of your own too.
 */
export function SectionTitle(props: SectionTitleProps) {
  const { component: Component = 'h3', className, children } = props

  return <Component className={cx(styles.title, className)}>{children}</Component>
}
