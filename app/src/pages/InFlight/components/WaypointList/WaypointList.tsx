import { Button, Disclosure, Typography } from '@nobs/ui'
import {
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
 * already flown are dimmed and the next one is highlighted. Folds away (collapsed by
 * default); the header still counts the fixes and warns about any that are missing.
 */
export function WaypointList(props: WaypointListProps) {
  const {
    waypoints,
    profile,
    flownNm,
    nextIndex,
    missingFixes,
    missingProcedures,
    onReload,
    open,
    onOpenChange,
  } = props

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
      <div className={styles.table}>
        <div className={styles.head}>
          <span className={styles.fixCol}>Fix</span>
          <span className={styles.dist}>{live ? 'To go' : 'nm'}</span>
          <span className={styles.num}>Plan</span>
          <span className={styles.limitCol}>Limit</span>
          <span className={styles.speedCol}>Speed</span>
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
              </div>
            )
          }

          const { planned, index } = row
          const wp = planned.waypoint
          const sub = wp.runway ? `RWY ${wp.runway}` : (wp.via ?? PHASE_LABEL[wp.phase])
          const rowClass = passed
            ? styles.passed
            : live && index === nextIndex
              ? styles.next
              : styles.row
          return (
            <div key={`${wp.key}-${index}`} className={rowClass}>
              <span className={styles.fixCol}>
                <span className={styles.ident}>{wp.ident}</span>
                <span className={styles.sub}>{sub}</span>
              </span>
              <span className={styles.dist}>{dist}</span>
              <span className={planned.meetsLimit ? styles.num : styles.numMissed}>
                {formatAltitude(Math.round(planned.plannedFt / 100) * 100)}
              </span>
              <span className={styles.limitCol}>
                {wp.altitude ? formatAltitudeLimit(wp.altitude) : ''}
              </span>
              <span className={styles.speedCol}>{wp.speed ? formatSpeedLimit(wp.speed) : ''}</span>
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
