import { Flag1Outlined, Flag1Solid } from '@lineiconshq/free-icons'
import { Button, cx, Disclosure, IconButton, Typography } from '@nobs/ui'
import { useState } from 'react'
import {
  canBeDescentReference,
  type DescentReference,
  formatAltitude,
  formatAltitudeLimit,
  formatDistance,
  formatSpeedLimit,
  type PlannedWaypoint,
  type RoutePhase,
  type RouteWaypoint,
  type VerticalProfile,
} from '~/pages/InFlight/domain'
import styles from './WaypointList.module.css'

const PHASE_LABEL: Record<RoutePhase, string> = {
  departure: 'SID',
  enroute: 'DCT',
  arrival: 'STAR',
  approach: 'APP',
}

type Row =
  | { kind: 'fix'; planned: PlannedWaypoint<RouteWaypoint>; index: number; distanceNm: number }
  | { kind: 'top'; label: string; distanceNm: number; altitudeFt: number }

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

const altitudeText = (ft: number) => {
  const text = formatAltitude(Math.round(ft / 100) * 100)
  return text.startsWith('FL') ? text : `${text} ft`
}

/** One line on what the TOD is planned to, and how to change it. */
function referenceNote(
  reference: DescentReference,
  waypoints: readonly PlannedWaypoint<RouteWaypoint>[],
  topFt: number,
): string {
  const wp = waypoints[reference.index]?.waypoint
  const name = wp?.runway ? `runway ${wp.runway}` : (wp?.ident ?? 'the runway')
  const at = reference.altitudeFt !== undefined ? ` at ${altitudeText(reference.altitudeFt)}` : ''
  switch (reference.source) {
    case 'default':
      return `TOD planned to ${name}${at}, the first approach fix with an altitude. Tap a fix's flag to plan to it instead.`
    case 'runway':
      return `TOD planned to the runway: no approach fix has an altitude. Tap a fix's flag to plan to it instead.`
    case 'selected':
      if (reference.altitudeFt !== undefined && reference.altitudeFt >= topFt - 0.5) {
        return `${name}'s limit${at} is at or above the cruise altitude, so it doesn't move the TOD. Tap its flag again for the default.`
      }
      return reference.altitudeFt !== undefined || wp?.runway
        ? `TOD planned to ${name}${at}, your pick. Tap its flag again for the default.`
        : `${name} has no altitude limit, so the descent passes it on the way to the runway. Tap its flag again for the default.`
  }
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
  // The row whose flag button a tap revealed (UI only: hover reveals it with a mouse).
  const [revealed, setRevealed] = useState<number | undefined>(undefined)

  const rows: Row[] = waypoints.map((planned, index) => ({
    kind: 'fix',
    planned,
    index,
    distanceNm: planned.waypoint.distanceNm,
  }))
  const tops: Row[] =
    Math.abs(profile.todNm - profile.tocNm) < 0.5
      ? [{ kind: 'top', label: 'T/D', distanceNm: profile.tocNm, altitudeFt: profile.topFt }]
      : [
          { kind: 'top', label: 'TOC', distanceNm: profile.tocNm, altitudeFt: profile.topFt },
          { kind: 'top', label: 'TOD', distanceNm: profile.todNm, altitudeFt: profile.topFt },
        ]
  for (const top of tops) {
    const at = rows.findIndex((r) => r.distanceNm > top.distanceNm)
    rows.splice(at < 0 ? rows.length : at, 0, top)
  }

  const live = flownNm !== undefined
  const notes = [
    missingProcedures.length > 0 && `Not in the database: ${missingProcedures.join(', ')}.`,
    missingFixes.length > 0 && `Fixes not found (left out): ${missingFixes.join(', ')}.`,
  ].filter(Boolean)
  const routeWaypoints = waypoints.map((p) => p.waypoint)

  return (
    <Disclosure
      title="Waypoints"
      summary={[
        `${waypoints.length} fixes`,
        `${formatDistance(profile.totalNm)} nm`,
        notes.length > 0 && 'some missing',
      ]
        .filter(Boolean)
        .join('  ·  ')}
      open={open}
      onOpenChange={onOpenChange}
      disableGutters
    >
      {notes.length > 0 && (
        <Typography variant="caption" color="warning" className={styles.gutters}>
          {notes.join(' ')}
        </Typography>
      )}
      <Typography variant="caption" color="dim" className={styles.gutters}>
        {referenceNote(reference, waypoints, profile.topFt)}
      </Typography>
      <div className={styles.table}>
        <div className={styles.head}>
          <span className={styles.fixCol}>Fix</span>
          <span className={styles.dist}>{live ? 'To go' : 'nm'}</span>
          <span className={styles.num}>Plan</span>
          <span className={styles.limitCol}>Limit</span>
          <span className={styles.speedCol}>Speed</span>
          <span className={styles.actionCol} />
        </div>
        {rows.map((row) => {
          const passed = live && row.distanceNm < flownNm - 0.05
          const shownNm = live ? row.distanceNm - flownNm : row.distanceNm
          const dist = passed ? '' : formatDistance(shownNm)

          if (row.kind === 'top') {
            return (
              <div key={row.label} className={passed ? styles.topPassed : styles.top}>
                <span className={styles.fixCol}>{row.label}</span>
                <span className={styles.dist}>{dist}</span>
                <span className={styles.num}>
                  {formatAltitude(Math.round(row.altitudeFt / 100) * 100)}
                </span>
                <span className={styles.limitCol} />
                <span className={styles.speedCol} />
                <span className={styles.actionCol} />
              </div>
            )
          }

          const { planned, index } = row
          const wp = planned.waypoint
          const isReference = index === reference.index
          const sub = isReference
            ? 'TOD REF'
            : wp.runway
              ? `RWY ${wp.runway}`
              : (wp.via ?? PHASE_LABEL[wp.phase])
          const rowClass = passed
            ? styles.passed
            : live && index === nextIndex
              ? styles.next
              : styles.row
          const cells = (
            <>
              <span className={styles.fixCol}>
                <span className={styles.ident}>{wp.ident}</span>
                <span className={isReference ? styles.refSub : styles.sub}>{sub}</span>
              </span>
              <span className={styles.dist}>{dist}</span>
              <span className={planned.meetsLimit ? styles.num : styles.numMissed}>
                {formatAltitude(Math.round(planned.plannedFt / 100) * 100)}
              </span>
              <span className={styles.limitCol}>
                {/* A "between" limit ('5000A 7000B') as two lines, floor below the ceiling. */}
                {wp.altitude &&
                  formatAltitudeLimit(wp.altitude)
                    .split(' ')
                    .reverse()
                    .map((part) => <span key={part}>{part}</span>)}
              </span>
              <span className={styles.speedCol}>{wp.speed ? formatSpeedLimit(wp.speed) : ''}</span>
            </>
          )
          const key = `${wp.key}-${index}`
          if (!canBeDescentReference(routeWaypoints, index)) {
            return (
              <div key={key} className={rowClass}>
                {cells}
                <span className={styles.actionCol} />
              </div>
            )
          }
          return (
            // A tap on the row only reveals the flag (pointer convenience for VR); the flag
            // itself is the real, keyboard-reachable control.
            // biome-ignore lint/a11y/useKeyWithClickEvents: the IconButton inside is focusable
            // biome-ignore lint/a11y/noStaticElementInteractions: see above
            <div
              key={key}
              className={cx(rowClass, styles.selectable, revealed === index && styles.revealed)}
              onClick={() => setRevealed(index)}
            >
              {cells}
              <span className={styles.actionCol}>
                <IconButton
                  icon={isReference ? Flag1Solid : Flag1Outlined}
                  // The picked reference's flag goes back to the default; the default's
                  // (filled too) makes it an explicit pick.
                  label={
                    isReference && reference.source === 'selected'
                      ? 'Back to the default TOD reference'
                      : `Plan the TOD to ${wp.ident}`
                  }
                  size="sm"
                  variant={isReference ? 'solid' : 'simple'}
                  color="accent"
                  aria-pressed={isReference}
                  className={isReference ? undefined : styles.flag}
                  onClick={() => onSelectReference(index)}
                />
              </span>
            </div>
          )
        })}
      </div>
      <Button variant="soft" onClick={onReload} className={styles.gutters}>
        Reload flight plan
      </Button>
    </Disclosure>
  )
}
