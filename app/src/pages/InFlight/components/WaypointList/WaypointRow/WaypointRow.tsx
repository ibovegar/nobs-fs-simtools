import { Flag1Outlined, Flag1Solid } from '@lineiconshq/free-icons'
import { IconButton } from '@nobs/ui'
import type { WaypointRowModel } from '~/pages/InFlight/domain'
import { FixLabel } from '../FixLabel'
import { TableCell } from '../TableCell'
import { TableRow } from '../TableRow'

interface WaypointRowProps {
  row: WaypointRowModel
  /** The row whose flag a tap revealed. */
  revealedKey?: string
  onReveal: (key: string) => void
  onSelectReference: (index: number) => void
}

/**
 * A row of the waypoint table: a fix, or TOC / TOD. A fix that can be the TOD reference
 * gets a flag button (filled on the reference itself).
 */
export function WaypointRow(props: WaypointRowProps) {
  const { row, revealedKey, onReveal, onSelectReference } = props
  const { flag } = row
  const revealed = revealedKey === row.key
  const flagButton = flag ? (
    <IconButton
      icon={row.isReference ? Flag1Solid : Flag1Outlined}
      label={flag.label}
      size="sm"
      variant={row.isReference ? 'solid' : 'simple'}
      color="accent"
      aria-pressed={row.isReference}
      onClick={() => onSelectReference(flag.index)}
    />
  ) : undefined
  const reveal = flag ? () => onReveal(row.key) : undefined

  return (
    <TableRow
      kind={row.kind}
      state={row.state}
      action={flagButton}
      pinAction={row.isReference}
      onReveal={reveal}
      revealed={revealed}
    >
      <TableCell column="fix">
        <FixLabel ident={row.ident} sub={row.sub} highlight={row.isReference} />
      </TableCell>
      <TableCell column="dist">{row.distance}</TableCell>
      <TableCell column="plan" warning={row.missesLimit}>
        {row.planned}
      </TableCell>
      <TableCell column="limit" lines={row.limitLines} />
      <TableCell column="speed">{row.speed}</TableCell>
    </TableRow>
  )
}
