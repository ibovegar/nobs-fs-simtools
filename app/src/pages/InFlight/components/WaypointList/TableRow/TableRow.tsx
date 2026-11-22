import { cx } from '@nobs/ui'
import type { ReactNode } from 'react'
import type { WaypointRowState } from '~/pages/InFlight/domain'
import styles from './TableRow.module.css'

export type TableRowKind = 'head' | 'fix' | 'top'

const ROW_CLASS: Record<TableRowKind, Record<WaypointRowState, string | undefined>> = {
  head: { upcoming: styles.head, next: styles.head, passed: styles.head },
  fix: { upcoming: styles.row, next: styles.next, passed: styles.passed },
  top: { upcoming: styles.top, next: styles.top, passed: styles.topPassed },
}

interface TableRowProps {
  kind?: TableRowKind
  state?: WaypointRowState
  /** The last column (a small icon button); left empty so the other columns stay aligned. */
  action?: ReactNode
  /** Always show the action; otherwise it shows on hover, or once the row is revealed. */
  pinAction?: boolean
  /** A tap on the row reveals its action (VR lasers don't hover). Omit when it has none. */
  onReveal?: () => void
  revealed?: boolean
  children?: ReactNode
}

/** One line of the waypoint table: its cells, then the action column. */
export function TableRow(props: TableRowProps) {
  const {
    kind = 'fix',
    state = 'upcoming',
    action,
    pinAction = false,
    onReveal,
    revealed = false,
    children,
  } = props
  const rowClass = cx(
    ROW_CLASS[kind][state],
    onReveal && styles.selectable,
    revealed && styles.revealed,
  )
  const actionClass = cx(styles.action, !pinAction && styles.hoverAction)

  return (
    // A tap on the row only reveals the action (pointer convenience for VR); the action
    // itself is the real, keyboard-reachable control.
    // biome-ignore lint/a11y/useKeyWithClickEvents: the action inside is focusable
    // biome-ignore lint/a11y/noStaticElementInteractions: see above
    <div className={rowClass} onClick={onReveal}>
      {children}
      <span className={actionClass}>{action}</span>
    </div>
  )
}
