import { cx, useElementSize, useTheme } from '@nobs/ui'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import {
  type AircraftOnRoute,
  altitudeAt,
  altitudeScale,
  type ChartWaypoint,
  canBeDescentReference,
  chartLabel,
  clipProfile,
  fixTooltip,
  formatAltitude,
  formatInteger,
  labelWidthPx,
  niceStep,
  type PlacedName,
  type PlannedWaypoint,
  type ProfilePoint,
  type ProfileView,
  placeNames,
  type RoutePhase,
  ticks,
  trendEnd,
  trendLengthPx,
  type VerticalProfile,
  viewRange,
} from '~/pages/InFlight/domain'
import { FixTooltip } from './FixTooltip'
import styles from './RouteProfile.module.css'

/**
 * Room for the TOC/TOD labels (top) and the nm row (bottom). The altitude labels and the fix
 * names sit inside the plot, so it runs (nearly) edge to edge.
 */
const PAD = { top: 24, right: 8, bottom: 22, left: 8 }
/** Labels this close to an edge are anchored inwards instead of centred, so none is cut. */
const LABEL_EDGE_PX = 24
/** Room for the distance unit at the left end of the nm row. */
const UNIT_PX = 44
/**
 * A runway at the route's ends: a symbol, not to scale (it would be a dot on most views).
 * The chart keeps this much room for it, so the takeoff roll starts a little in; long
 * enough for its name above it.
 */
const RUNWAY_PX = 32
/** Space kept between two fix names. */
const NAME_GAP_PX = 2
/** The fix names' font size at 100 % text size (as in the CSS). */
const NAME_FONT_PX = 9
/** Beside the drop line to the name. */
const NAME_SIDE_PX = 8
/** Around a fix's dot, the area that opens its tooltip: big enough for a VR laser. */
const HIT_PX = 12

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
  /** Index of the fix the TOD is planned to: a flag above it. */
  referenceIndex?: number
  /** The reference is the pilot's pick, not the default. */
  referencePicked?: boolean
  /** Pick a fix as the TOD reference (again: back to the default). Omitted: no button. */
  onSelectReference?: (index: number) => void
}

/**
 * Side view of the planned flight: the climb / cruise / descent profile, every fix with
 * its planned altitude, TOC and TOD, and the aircraft. The descent
 * view counts distance to go; the others distance from departure.
 */
export function RouteProfile(props: RouteProfileProps) {
  const {
    profile,
    waypoints,
    view,
    showToc = true,
    aircraft,
    nextIndex,
    referenceIndex,
    referencePicked = false,
    onSelectReference,
  } = props

  const ref = useRef<HTMLDivElement>(null)
  // The fix under the mouse (a ring: it can be clicked), and the one clicked or tapped,
  // whose tooltip is open: its waypoint index and hit area (the tooltip's anchor).
  const [hovered, setHovered] = useState<number>()
  const [pinned, setPinned] = useState<FixTarget>()
  const { scale, textScale } = useTheme()
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

  // The scale ends at the flight's top (cruise), whichever part of it is shown, or higher
  // when the aircraft is above it.
  const highestFt = Math.max(profile.topFt, showAircraft?.altitudeFt ?? 0)
  const { maxFt, ticks: altTicks } = altitudeScale(highestFt)

  // Room for the runways at the ends: the takeoff roll before the departure fix, the
  // arrival runway after its threshold.
  const first = waypoints[0]?.waypoint
  const last = waypoints.length > 1 ? waypoints[waypoints.length - 1]?.waypoint : undefined
  const departureRunway = first?.runway !== undefined && inRange(first.distanceNm)
  const arrivalRunway = last?.runway !== undefined && inRange(last.distanceNm)
  const plotLeft = PAD.left + (departureRunway ? RUNWAY_PX : 0)
  const plotRight = width - PAD.right - (arrivalRunway ? RUNWAY_PX : 0)

  const groundY = height - PAD.bottom
  const plotW = Math.max(1, plotRight - plotLeft)
  const plotH = Math.max(1, groundY - PAD.top)
  const x = (nm: number) => plotLeft + ((nm - range.fromNm) / spanNm) * plotW
  const y = (ft: number) => groundY - (Math.max(0, Math.min(ft, maxFt)) / maxFt) * plotH

  const profilePoints = line.map((p) => `${x(p.distanceNm)},${y(p.altitudeFt)}`).join(' ')
  const area = `${x(range.fromNm)},${groundY} ${profilePoints} ${x(range.toNm)},${groundY}`

  const tocX = x(profile.tocNm)
  const todX = x(profile.todNm)
  const topY = y(profile.topFt)
  // Every fix is named inside the chart, level with its dot: on the side where the path is
  // higher (right in the climb, left in the descent; a line below in cruise), else the other
  // side or a line up or down. The route's ends, the next fix and fixes with limits are
  // placed first, so they win a crowded spot.
  const nameFontPx = NAME_FONT_PX * textScale
  const byImportance = visible
    .map(({ planned, index }, i) => ({
      planned,
      i,
      isNext: index === nextIndex,
      rank:
        index === 0 || index === waypoints.length - 1
          ? 3
          : index === nextIndex
            ? 2
            : planned.waypoint.altitude
              ? 1
              : 0,
    }))
    .sort((a, b) => b.rank - a.rank || a.i - b.i)
  const nameTexts = byImportance.map(({ planned }) => chartLabel(planned.waypoint))
  // Names keep off the aircraft and the runways; a runway's own name sits above it.
  // (No flatMap: the sim's browser doesn't have it.)
  const obstacles = visible
    .filter(({ planned }) => planned.waypoint.runway !== undefined)
    .map(({ planned }) => {
      const rx = x(planned.waypoint.distanceNm)
      const ry = y(planned.plannedFt)
      const left = planned.waypoint.phase === 'departure' ? rx - RUNWAY_PX : rx
      return { left, top: ry - 3, right: left + RUNWAY_PX, bottom: ry + 3 }
    })
  const reference = visible.find(({ index }) => index === referenceIndex)?.planned
  const referenceFlag = reference && {
    x: x(reference.waypoint.distanceNm),
    baseY: y(reference.plannedFt) - 5,
  }
  if (referenceFlag) {
    const { x: fx, baseY } = referenceFlag
    obstacles.push({ left: fx - 1, top: baseY - FLAG_PX, right: fx + 9, bottom: baseY })
  }
  if (showAircraft) {
    const ax = x(showAircraft.distanceNm)
    const ay = y(showAircraft.altitudeFt)
    obstacles.push({ left: ax - 8, top: ay - 8, right: ax + 11, bottom: ay + 8 })
  }
  const placed = placeNames(
    byImportance.map(({ planned }, k) => {
      const wp = planned.waypoint
      const departureRunway = wp.runway !== undefined && wp.phase === 'departure'
      return {
        pointX: x(wp.distanceNm),
        pointY: y(planned.plannedFt),
        widthPx: labelWidthPx(nameTexts[k] ?? '', nameFontPx),
        // A runway's name goes over the runway: left of the departure fix (the takeoff roll),
        // right of the arrival one.
        preferRight: wp.runway !== undefined ? !departureRunway : !isDescending(wp.phase),
        below: Math.abs(planned.plannedFt - profile.topFt) < 1,
        sidePx: wp.runway !== undefined ? 0 : undefined,
      }
    }),
    {
      fontPx: nameFontPx,
      minX: PAD.left,
      maxX: width - PAD.right,
      groundY,
      sidePx: NAME_SIDE_PX,
      gapPx: NAME_GAP_PX,
      obstacles,
    },
  )
  const nameAt = new Map<number, { name: string; isNext: boolean } & PlacedName>()
  byImportance.forEach(({ i, isNext }, k) => {
    const spot = placed[k]
    if (spot) nameAt.set(i, { name: nameTexts[k] ?? '', isNext, ...spot })
  })

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

  const sameTop = Math.abs(todX - tocX) < 28

  // The tooltip of the clicked fix, while it's in view.
  const target = pinned
  const shown = visible.find(({ index }) => index === target?.index)?.planned
  const tooltip = target &&
    shown && {
      anchorEl: target.el,
      model: fixTooltip({
        waypoint: shown.waypoint,
        startNm,
        flownNm: aircraft?.distanceNm,
        groundSpeedKt: aircraft?.groundSpeedKt,
        isReference: target.index === referenceIndex,
        isPickedReference: referencePicked,
        canBeReference:
          onSelectReference !== undefined &&
          canBeDescentReference(
            waypoints.map((w) => w.waypoint),
            target.index,
          ),
      }),
    }
  // The tap also reaches the document, which closes the tooltip: the chart then shows the
  // new TOD and the flag on the fix.
  const selectTappedFix = target && onSelectReference && (() => onSelectReference(target.index))
  const tapFix = (fix: FixTarget) => {
    // The chart stops taking the mouse while the tooltip is open, so the ring would stay.
    setHovered(undefined)
    setPinned((current) => (current?.index === fix.index ? undefined : fix))
  }

  // A tapped fix's tooltip stays until a tap anywhere else (a tap on a fix doesn't reach
  // the document). Listening only while one is open.
  const isPinned = pinned !== undefined
  useEffect(() => {
    if (!isPinned) return
    const close = () => setPinned(undefined)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [isPinned])
  // While a tooltip is open the chart takes no taps: in the sim the SVG under the tooltip
  // would catch the tap meant for its button (a low fix's tooltip sits over the chart). A
  // tap on the chart then closes the tooltip, like a tap anywhere else.
  const svgClass = cx(styles.svg, isPinned && styles.passive)

  return (
    <div ref={ref} className={styles.profile}>
      {width > 0 && (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${width} ${height}`}
          className={svgClass}
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
                y={groundY + 16}
                textAnchor={anchor(x(t.nm))}
              >
                {formatInteger(t.label)}
              </text>
            ))}
          {/* The distance unit at the left end of the nm row. */}
          <text className={styles.distLabel} x={PAD.left} y={groundY + 16} textAnchor="start">
            {toGo ? 'nm to go' : 'nm'}
          </text>

          {visible.map(({ planned, index }, i) => {
            const wx = x(planned.waypoint.distanceNm)
            const wy = y(planned.plannedFt)
            const isNext = index === nextIndex
            // The tapped fix (its tooltip held open) in orange; the next fix in the accent.
            const dot =
              index === pinned?.index
                ? { className: styles.fixPinned, r: 5 }
                : { className: isNext ? styles.fixNext : styles.fix, r: isNext ? 4 : 3 }
            const hoverRing = index === hovered && (
              <circle className={styles.fixHover} cx={wx} cy={wy} r={HIT_PX - 3} />
            )
            return (
              <g key={`${planned.waypoint.key}-${index}`}>
                <line className={styles.drop} x1={wx} y1={wy} x2={wx} y2={groundY} />
                {planned.waypoint.runway && (
                  <RunwayMarker x={wx} y={wy} departure={planned.waypoint.phase === 'departure'} />
                )}
                <FixName label={nameAt.get(i)} />
                {hoverRing}
                <circle className={dot.className} cx={wx} cy={wy} r={dot.r} />
              </g>
            )
          })}

          <ReferenceFlag flag={referenceFlag} />

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

          {/* On top of everything: what opens a fix's tooltip. */}
          {visible.map(({ planned, index }) => (
            <FixHitArea
              key={`${planned.waypoint.key}-${index}-hit`}
              index={index}
              x={x(planned.waypoint.distanceNm)}
              y={y(planned.plannedFt)}
              onHover={setHovered}
              onTap={tapFix}
            />
          ))}
        </svg>
      )}
      {tooltip && (
        <FixTooltip
          model={tooltip.model}
          anchorEl={tooltip.anchorEl}
          onSelectReference={selectTappedFix}
        />
      )}
    </div>
  )
}

/** A fix with a tooltip: its waypoint index and its hit area. */
interface FixTarget {
  index: number
  el: Element
}

interface FixHitAreaProps {
  index: number
  x: number
  y: number
  /** The fix under the mouse (its index), or undefined when it leaves. */
  onHover: (index: number | undefined) => void
  /** A tap or click: opens (or closes) its tooltip. */
  onTap: (fix: FixTarget) => void
}

/**
 * An invisible circle around a fix's dot: hovering it rings the fix (it can be clicked), a
 * click or tap opens its tooltip.
 */
function FixHitArea(props: FixHitAreaProps) {
  const { index, x, y, onHover, onTap } = props
  const tap = (event: MouseEvent) => {
    // Not a tap on the chart around it, which closes the tooltip.
    event.stopPropagation()
    onTap({ index, el: event.currentTarget })
  }

  return (
    // The chart is hidden from screen readers; the waypoint list has the same details.
    // biome-ignore lint/a11y/noStaticElementInteractions: see above
    <circle
      className={styles.hit}
      cx={x}
      cy={y}
      r={HIT_PX}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(undefined)}
      onClick={tap}
    />
  )
}

interface RunwayMarkerProps {
  /** The runway's fix: where the climb starts, or where the descent touches down. */
  x: number
  /** Its planned altitude: the field elevation. */
  y: number
  /** The departure runway ends at its fix (with the takeoff roll on it); the arrival runway starts at its fix. */
  departure: boolean
}

/**
 * A runway at the field elevation, as in the GS side view: the profile climbs from the end
 * of the departure runway, after a short takeoff roll along it, and comes down onto the
 * start of the arrival runway.
 */
function RunwayMarker(props: RunwayMarkerProps) {
  const { x, y, departure } = props
  const left = departure ? x - RUNWAY_PX : x

  return (
    <g>
      <rect className={styles.runway} x={left} y={y - 2} width={RUNWAY_PX} height={5} />
      {departure && <line className={styles.path} x1={left} y1={y} x2={x} y2={y} />}
    </g>
  )
}

/** Height of the TOD reference's flag (pole), px. */
const FLAG_PX = 12

interface ReferenceFlagProps {
  /** Where the pole stands (its foot); undefined: the reference fix isn't in view. */
  flag: { x: number; baseY: number } | undefined
}

/** The TOD reference: a small flag above the fix, like the flag button in the waypoint list. */
function ReferenceFlag(props: ReferenceFlagProps) {
  const { flag } = props

  if (!flag) return null
  const { x, baseY } = flag
  const topY = baseY - FLAG_PX

  return (
    <g className={styles.referenceFlag}>
      <line x1={x} y1={baseY} x2={x} y2={topY} />
      <polygon points={`${x},${topY} ${x + 8},${topY + 3} ${x},${topY + 6}`} />
    </g>
  )
}

/** Arrival and approach fixes: the path descends into them. */
const isDescending = (phase: RoutePhase) => phase === 'arrival' || phase === 'approach'

interface FixNameProps {
  /** The name and where it goes; undefined: the fix has no name drawn. */
  label: { name: string; left: number; baseline: number; isNext: boolean } | undefined
}

/** A fix's name level with the fix, inside the chart: weak, the next fix's in accent. */
function FixName(props: FixNameProps) {
  const { label } = props

  if (!label) return null
  return (
    <text
      className={label.isNext ? styles.fixNameNext : styles.fixName}
      x={label.left}
      y={label.baseline}
      textAnchor="start"
    >
      {label.name}
    </text>
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
