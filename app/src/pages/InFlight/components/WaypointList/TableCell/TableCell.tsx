import type { ReactNode } from 'react'
import styles from './TableCell.module.css'

export type TableColumn = 'fix' | 'via' | 'dist' | 'limit' | 'speed'

interface TableCellProps {
  column: TableColumn
  /** Stacked lines, top first, in place of children (a "between" limit). */
  lines?: readonly string[]
  children?: ReactNode
}

/** A cell of the waypoint table: the fix column stretches, the others are fixed-width. */
export function TableCell(props: TableCellProps) {
  const { column, lines = [], children } = props

  return (
    <span className={styles[column]}>
      {children}
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  )
}
