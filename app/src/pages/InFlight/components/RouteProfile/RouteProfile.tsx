import { useElementSize, useTheme } from '@nobs/ui'
import { useRef } from 'react'
import {
  type AircraftOnRoute,
  type AltitudeConstraint,
  altitudeAt,
  altitudeScale,
  type ChartWaypoint,
  clipProfile,
  formatAltitude,
  formatInteger,
  niceStep,
  type PlannedWaypoint,
  type ProfilePoint,
  type ProfileView,
  pickLabels,
  ticks,
  trendEnd,
  trendLengthPx,
  type VerticalProfile,
  viewRange,
} from '~/pages/InFlight/domain'
import styles from './RouteProfile.module.css'

/**
 * Room for the TOC/TOD labels (top) and the fix and nm labels (bottom). The altitude labels
 * sit inside the plot, so it runs (nearly) edge to edge.
 */
const PAD = { top: 24, right: 8, bottom: 38, left: 8 }
const LABEL_GAP_PX = 42
/** Labels this close to an edge are anchored inwards instead of centred, so none is cut. */
const LABEL_EDGE_PX = 24
/** Room for the distance unit at the left end of the nm row. */
const UNIT_PX = 44

interface RouteProfileProps {
  profile: VerticalProfile
  waypoints: readonly PlannedWaypoint<ChartWaypoint>[]
  view: ProfileView
  /** Draw the TOC marker (the TOD calculator's view has no climb). Default true. */
  showToc?: boolean
  /** The live aircraft on the route; omitted without a position. */
  aircraft?: AircraftOnRoute
  /** Index of the next waypoint, highlighted while flying. */
  nextIndex?: number
}

/**
 * Side view of the planned flight: the climb / cruise / descent profile, every fix with
 * its planned altitude and altitude limits, TOC and TOD, and the aircraft. The descent
 * view counts distance to go; the others distance from departure.
 */
export function RouteProfile(props: RouteProfileProps) {
  const { profile, waypoints, view, showToc = true, aircraft, nextIndex } = props

  const ref = useRef<HTMLDivElement>(null)
  const { scale } = useTheme()
  const size = useElementSize(ref)
  // Drawn in unscaled px: the viewBox enlarges the drawing with the UI scale.
  const width = size.width / scale
  const height = size.height / scale

  const startNm = waypoints[0]?.waypoint.distanceNm ?? 0
  const endNm = startNm + profile.totalNm
  const range = viewRange(profile, view, startNm)
  const spanNm = Math.max(range.toNm - range.fromNm, 0.1)
  const line = clipProfile(profile.points, range)

  const inRange = (nm: number) => nm >= range.fromNm - 1e-6 && nm <= range.toNm + 1e-6
  const visible = waypoints
    .map((planned, index) => ({ planned, index }))
    .filter((w) => inRange(w.planned.waypoint.distanceNm))
  const showAircraft = aircraft && inRange(aircraft.distanceNm) ? aircraft : undefined

  // The scale ends at the flight's top (cruise), whichever part of it is shown.
  let highestFt = profile.topFt
  for (const { planned } of visible) {
    const limit = planned.waypoint.altitude
    highestFt = Math.max(highestFt, limit?.lowerFt ?? 0, limit?.upperFt ?? 0)
  }
  if (showAircraft) highestFt = Math.max(highestFt, showAircraft.altitudeFt)
  const { maxFt, ticks: altTicks } = altitudeScale(highestFt)

  const groundY = height - PAD.bottom
  const plotW = Math.max(1, width - PAD.left - PAD.right)
  const plotH = Math.max(1, groundY - PAD.top)
  const x = (nm: number) => PAD.left + ((nm - range.fromNm) / spanNm) * plotW
  const y = (ft: number) => groundY - (Math.max(0, Math.min(ft, maxFt)) / maxFt) * plotH

  const profilePoints = line.map((p) => `${x(p.distanceNm)},${y(p.altitudeFt)}`).join(' ')
  const area = `${x(range.fromNm)},${groundY} ${profilePoints} ${x(range.toNm)},${groundY}`

  const labels = pickLabels(
    visible.map(({ planned, index }) => ({
      x: x(planned.waypoint.distanceNm),
      priority:
        index === 0 || index === waypoints.length - 1
          ? 3
          : index === nextIndex
            ? 2
            : planned.waypoint.altitude
              ? 1
              : 0,
    })),
    LABEL_GAP_PX,
  )

  // Distance axis: to go in the descent view, from departure otherwise.
  const toGo = view === 'arrival'
  const distStep = niceStep(spanNm, Math.max(2, Math.floor(plotW / 70)))
  const distTicks = toGo
    ? ticks(endNm - range.toNm, endNm - range.fromNm, distStep).map((v) => ({
        nm: endNm - v,
        label: v,
      }))
    : ticks(range.fromNm - startNm, range.toNm - startNm, distStep).map((v) => ({
        nm: startNm + v,
        label: v,
      }))

  const anchor = (px: number) =>
    px < PAD.left + LABEL_EDGE_PX
      ? 'start'
      : px > width - PAD.right - LABEL_EDGE_PX
        ? 'end'
        : 'middle'

  const tocX = x(profile.tocNm)
  const todX = x(profile.todNm)
  const topY = y(profile.topFt)
  const sameTop = Math.abs(todX - tocX) < 28

  return (
    <div ref={ref} className={styles.profile}>
      {width > 0 && (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
          aria-hidden="true"
        >
          {altTicks.map((ft) => (
            <g key={ft}>
              <line
                className={styles.grid}
                x1={PAD.left}
                y1={y(ft)}
                x2={width - PAD.right}
                y2={y(ft)}
              />
              {/* Inside the plot, just above its line. */}
              <text className={styles.axisLabel} x={PAD.left + 2} y={y(ft) - 4} textAnchor="start">
                {formatAltitude(ft)}
              </text>
            </g>
          ))}

          <polygon className={styles.area} points={area} />
          <polyline className={styles.path} points={profilePoints} />
          <line
            className={styles.ground}
            x1={PAD.left}
            y1={groundY}
            x2={width - PAD.right}
            y2={groundY}
          />

          {distTicks
            .filter((t) => x(t.nm) >= PAD.left + UNIT_PX)
            .map((t) => (
              <text
                key={t.nm}
                className={styles.distLabel}
                x={x(t.nm)}
                y={groundY + 30}
                textAnchor={anchor(x(t.nm))}
              >
                {formatInteger(t.label)}
              </text>
            ))}
          {/* The distance unit at the left end of the nm row. */}
          <text className={styles.distLabel} x={PAD.left} y={groundY + 30} textAnchor="start">
            {toGo ? 'nm to go' : 'nm'}
          </text>

          {visible.map(({ planned, index }, i) => {
            const wx = x(planned.waypoint.distanceNm)
            const wy = y(planned.plannedFt)
            const isNext = index === nextIndex
            return (
              <g key={`${planned.waypoint.key}-${index}`}>
                <line className={styles.drop} x1={wx} y1={wy} x2={wx} y2={groundY} />
                {planned.waypoint.altitude && (
                  <LimitMarker
                    x={wx}
                    limit={planned.waypoint.altitude}
                    y={y}
                    missed={!planned.meetsLimit}
                  />
                )}
                <circle
                  className={isNext ? styles.fixNext : styles.fix}
                  cx={wx}
                  cy={wy}
                  r={isNext ? 4 : 3}
                />
                {labels[i] && (
                  <text
                    className={isNext ? styles.fixLabelNext : styles.fixLabel}
                    x={wx}
                    y={groundY + 14}
                    textAnchor={anchor(wx)}
                  >
                    {planned.waypoint.ident}
                  </text>
                )}
              </g>
            )
          })}

          {showToc && inRange(profile.tocNm) && profile.totalNm > 0 && (
            <TopMarker x={tocX} y={topY} label={sameTop ? 'T/D' : 'TOC'} />
          )}
          {(!sameTop || !showToc) && inRange(profile.todNm) && (
            <TopMarker x={todX} y={topY} label="TOD" />
          )}

          {showAircraft && (
            <Aircraft
              x={x(showAircraft.distanceNm)}
              y={y(showAircraft.altitudeFt)}
              pathY={y(altitudeAt(profile.points, showAircraft.distanceNm))}
              trend={
                showAircraft.trendFtPerNm === undefined
                  ? undefined
                  : trendEnd(showAircraft, showAircraft.trendFtPerNm, range.toNm, maxFt)
              }
              trendPx={trendLengthPx(showAircraft.groundSpeedKt ?? 0)}
              toScreen={(p) => ({ x: x(p.distanceNm), y: y(p.altitudeFt) })}
            />
          )}
        </svg>
      )}
    </div>
  )
}

interface LimitMarkerProps {
  x: number
  limit: AltitudeConstraint
  y: (ft: number) => number
  missed: boolean
}

/** A bar at the limit: a caret below for "at or above", above for "at or below". */
function LimitMarker(props: LimitMarkerProps) {
  const { x, limit, y, missed } = props
  const cls = missed ? styles.limitMissed : styles.limit

  return (
    <g className={cls}>
      {limit.lowerFt !== undefined && (
        <>
          <line x1={x - 6} y1={y(limit.lowerFt)} x2={x + 6} y2={y(limit.lowerFt)} />
          <polygon
            points={`${x - 4},${y(limit.lowerFt) + 6} ${x + 4},${y(limit.lowerFt) + 6} ${x},${y(limit.lowerFt) + 1}`}
          />
        </>
      )}
      {limit.upperFt !== undefined && (
        <>
          <line x1={x - 6} y1={y(limit.upperFt)} x2={x + 6} y2={y(limit.upperFt)} />
          <polygon
            points={`${x - 4},${y(limit.upperFt) - 6} ${x + 4},${y(limit.upperFt) - 6} ${x},${y(limit.upperFt) - 1}`}
          />
        </>
      )}
    </g>
  )
}

interface TopMarkerProps {
  x: number
  y: number
  label: string
}

function TopMarker(props: TopMarkerProps) {
  const { x, y, label } = props
  return (
    <g>
      <circle className={styles.top} cx={x} cy={y} r={4} />
      <text className={styles.topLabel} x={x} y={y - 9} textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

interface AircraftProps {
  x: number
  y: number
  /** Where the planned path is at the aircraft's distance. */
  pathY: number
  /** Where the current flight path (V/S at groundspeed) leaves the chart, if known. */
  trend?: ProfilePoint
  /** How long to draw the flight-path line, px (proportional to groundspeed). */
  trendPx: number
  toScreen: (p: ProfilePoint) => { x: number; y: number }
}

/** A navigation arrow pointing right (+x): slim, with a notched tail. */
const ARROW = 'M 9 0 L -5.5 -6 L -2.5 0 L -5.5 6 Z'

/**
 * The aircraft as a yellow arrow along its current flight path (V/S at groundspeed), a
 * yellow line pointing the same way, as long as the groundspeed is fast, and a dashed
 * yellow line to the planned path above or below it.
 */
function Aircraft(props: AircraftProps) {
  const { x, y, pathY, trend, trendPx, toScreen } = props
  let end = trend ? toScreen(trend) : undefined
  if (end) {
    const length = Math.hypot(end.x - x, end.y - y)
    if (length > trendPx) {
      const k = trendPx / length
      end = { x: x + (end.x - x) * k, y: y + (end.y - y) * k }
    }
  }
  const angle = end && end.x > x ? (Math.atan2(end.y - y, end.x - x) * 180) / Math.PI : 0
  const transform = `translate(${x} ${y}) rotate(${angle})`

  return (
    <g>
      {Math.abs(y - pathY) > 2 && (
        <line className={styles.deviation} x1={x} y1={pathY} x2={x} y2={y} />
      )}
      {end && end.x - x > 1 && (
        <line className={styles.trend} x1={x} y1={y} x2={end.x} y2={end.y} />
      )}
      {/* A halo in the card colour keeps the arrow clear of the lines under it. */}
      <path className={styles.aircraftHalo} d={ARROW} transform={transform} />
      <path className={styles.aircraft} d={ARROW} transform={transform} />
    </g>
  )
}
