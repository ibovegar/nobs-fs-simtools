import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './Section.module.css'

interface SectionMediaProps {
  className?: string
  children?: ReactNode
}

/** Content that runs edge to edge in a `Section` (a chart, a diagram), with no side padding. */
export function SectionMedia(props: SectionMediaProps) {
  const { className, children } = props

  return <div className={cx(styles.media, className)}>{children}</div>
}
