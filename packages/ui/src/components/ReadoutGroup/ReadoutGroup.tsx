import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './ReadoutGroup.module.css'

interface ReadoutGroupProps {
  /** A hairline between the items. */
  divided?: boolean
  className?: string
  children?: ReactNode
}

/**
 * Readouts side by side in equal widths (V1 / VR / V2, time / vertical speed), a step
 * apart. Flexbox only: Coherent has no CSS grid.
 */
export function ReadoutGroup(props: ReadoutGroupProps) {
  const { divided = false, className, children } = props

  return <div className={cx(styles.group, divided && styles.divided, className)}>{children}</div>
}
