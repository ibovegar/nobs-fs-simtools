import { cx } from '@nobs/ui'
import type { ReactNode } from 'react'
import styles from './TableCell.module.css'

export type TableColumn = 'fix' | 'dist' | 'plan' | 'limit' | 'speed'

interface TableCellProps {
  column: TableColumn
  /** Warning colour (a planned altitude that misses its limit). */
  warning?: boolean
  /** Stacked lines, top first, in place of children (a "between" limit). */
  lines?: readonly string[]
  children?: ReactNode
}

/** A cell of the waypoint table: the fix column stretches, the others are fixed-width. */
export function TableCell(props: TableCellProps) {
  const { column, warning = false, lines = [], children } = props

  return (
    <span className={cx(styles[column], warning && styles.warning)}>
      {children}
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  )
}
