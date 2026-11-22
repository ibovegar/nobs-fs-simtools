import { Button, Disclosure } from '@nobs/ui'
import { useState } from 'react'
import {
  type DescentReference,
  missingRouteNote,
  type PlannedWaypoint,
  type RouteWaypoint,
  referenceNote,
  type VerticalProfile,
  waypointRows,
  waypointSummary,
} from '~/pages/InFlight/domain'
import styles from './WaypointList.module.css'
import { WaypointNote } from './WaypointNote'
import { WaypointRow } from './WaypointRow'
import { WaypointTableHeader } from './WaypointTableHeader'

interface WaypointListProps {
  waypoints: readonly PlannedWaypoint<RouteWaypoint>[]
  profile: VerticalProfile
  /** The fix the TOD is planned to. */
  reference: DescentReference
  /** A fix was tapped: make it the TOD reference (if it already is: back to the default). */
  onSelectReference: (index: number) => void
  /** Distance flown along the route; omitted without a live position. */
  flownNm?: number
  nextIndex?: number
  missingFixes: readonly string[]
  missingProcedures: readonly string[]
  onReload: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Every fix on the route in order, with TOC and TOD slotted in: the distance (to go while
 * flying), the planned altitude, and the procedure's altitude and speed limits. Fixes
 * already flown are dimmed and the next one is highlighted. A fix after the SID shows a
 * flag button on the right when hovered, or when its row is tapped (VR lasers don't hover);
 * the flag makes it the TOD reference, marked "TOD REF" with the flag kept filled. Folds
 * away; the header still counts the fixes and warns about any that are missing.
 */
export function WaypointList(props: WaypointListProps) {
  const {
    waypoints,
    profile,
    reference,
    onSelectReference,
    flownNm,
    nextIndex,
    missingFixes,
    missingProcedures,
    onReload,
    open,
    onOpenChange,
  } = props
  // The row whose flag a tap revealed (UI only: hover reveals it with a mouse).
  const [revealedKey, setRevealedKey] = useState<string | undefined>(undefined)
  const live = flownNm !== undefined
  const rows = waypointRows({ waypoints, profile, reference, flownNm, nextIndex })
  const missingNote = missingRouteNote(missingProcedures, missingFixes)
  const summary = waypointSummary(waypoints.length, profile.totalNm, missingNote !== undefined)
  const planNote = referenceNote(reference, waypoints, profile.topFt)

  return (
    <Disclosure
      title="Waypoints"
      summary={summary}
      open={open}
      onOpenChange={onOpenChange}
      disableGutters
    >
      <WaypointNote color="warning">{missingNote}</WaypointNote>
      <WaypointNote color="dim">{planNote}</WaypointNote>
      <div className={styles.table}>
        <WaypointTableHeader live={live} />
        {rows.map((row) => (
          <WaypointRow
            key={row.key}
            row={row}
            revealedKey={revealedKey}
            onReveal={setRevealedKey}
            onSelectReference={onSelectReference}
          />
        ))}
      </div>
      <Button variant="soft" onClick={onReload} className={styles.gutters}>
        Reload flight plan
      </Button>
    </Disclosure>
  )
}
