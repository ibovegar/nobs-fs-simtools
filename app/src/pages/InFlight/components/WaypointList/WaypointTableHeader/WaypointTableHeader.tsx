import { TableCell } from '../TableCell'
import { TableRow } from '../TableRow'

interface WaypointTableHeaderProps {
  /** Flying: distances are to go. */
  live: boolean
}

/** The column headings. */
export function WaypointTableHeader(props: WaypointTableHeaderProps) {
  const { live } = props
  const distanceHeading = live ? 'To go' : 'nm'

  return (
    <TableRow kind="head">
      <TableCell column="fix">Fix</TableCell>
      <TableCell column="via">Via</TableCell>
      <TableCell column="dist">{distanceHeading}</TableCell>
      <TableCell column="limit">Limit</TableCell>
      <TableCell column="speed">Speed</TableCell>
    </TableRow>
  )
}
