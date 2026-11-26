import { useElementSize, useTheme } from '@nobs/ui'
import { useRef } from 'react'
import {
  angleApart,
  arrowLabelSpots,
  compassLabel,
  compassPoint,
  type RunwayShape,
  textWidthPx,
  type WindView,
} from '~/pages/Info/domain'
import styles from './WindCompass.module.css'

// Drawn in these units; the viewBox scales the drawing to the size it's shown at.
const SIZE = 320
/** Shown as wide as the card, up to this (px at UI scale 1). */
const MAX_PX = 420
const C = SIZE / 2
/** The compass: a quiet disc the aircraft or the runways fill most of. */
const RING_R = 92
/** N / E / S / W and the degrees between, just outside the ring. */
const LETTER_R = RING_R + 14
/** The wind arrow, outside the ring: from near the edge to just short of the ring. */
const ARROW_TAIL_R = RING_R + 44
const ARROW_TIP_R = RING_R + 5
const ARROW_HEAD = 10
/** Down from a label's centre to its baseline (the sim's browser may not centre text). */
const BASELINE = 4

/** A short tick on the ring every 30°. */
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const deg = i * 30
  const inner = compassPoint(deg, RING_R - 6)
  const outer = compassPoint(deg, RING_R)
  return { deg, x1: C + inner.x, y1: C + inner.y, x2: C + outer.x, y2: C + outer.y }
})

/** Every 30°: the cardinal letters, the degrees between. */
const LABELS = Array.from({ length: 12 }, (_, i) => {
  const deg = i * 30
  const p = compassPoint(deg, LETTER_R)
  const label = compassLabel(deg)
  const className = deg === 0 ? 'north' : label.cardinal ? 'letter' : 'degree'
  return { deg, text: label.text, className, x: C + p.x, y: C + p.y + BASELINE }
})

/**
 * A jet seen from above, nose up, centred on 0,0: a rounded nose, swept wings and
 * tailplane (28 px long, 26 px span).
 */
const AIRCRAFT =
  'M 0 -14 C 1.5 -14 2.2 -12.2 2.2 -10 L 2.2 -3.5 L 13 3 L 13 5.5 L 2.2 2.5 L 2 9 L 5.5 11.6 L 5.5 13.6 L 0 12.4 L -5.5 13.6 L -5.5 11.6 L -2 9 L -2.2 2.5 L -13 5.5 L -13 3 L -2.2 -3.5 L -2.2 -10 C -2.2 -12.2 -1.5 -14 0 -14 Z'
const AIRCRAFT_SCALE = 1.1
/** The heading line starts just ahead of the nose. */
const NOSE_R = 14 * AIRCRAFT_SCALE + 5

/** The wind arrow, drawn for a north wind (coming down from the top), turned to the wind. */
const ARROW_SHAFT_END = C - ARROW_TIP_R - ARROW_HEAD + 2
/** A light breeze's arrow reaches this far out; a strong wind's to the edge. */
const ARROW_MIN_REACH = ARROW_TIP_R + ARROW_HEAD + 8

/** Where the wind comes from, lit on the ring: an arc this many degrees either side. */
const SECTOR_DEG = 18
const SECTOR_START = compassPoint(-SECTOR_DEG, RING_R)
const SECTOR_END = compassPoint(SECTOR_DEG, RING_R)
const SECTOR = `M ${C + SECTOR_START.x} ${C + SECTOR_START.y} A ${RING_R} ${RING_R} 0 0 1 ${C + SECTOR_END.x} ${C + SECTOR_END.y}`
const ARROW_HEAD_POINTS = `${C},${C - ARROW_TIP_R} ${C - ARROW_HEAD / 1.4},${C - ARROW_TIP_R - ARROW_HEAD} ${C + ARROW_HEAD / 1.4},${C - ARROW_TIP_R - ARROW_HEAD}`

/** The wind's figures beside the arrow: font sizes (px at text size 100 %), line height, gap. */
const DIRECTION_FONT = 11
const SPEED_FONT = 10
const FIGURE_H = 12
const FIGURE_GAP = 13
/** The figures sit at the arrow's outer end, never closer to the ring than this. */
const FIGURES_MIN_R = RING_R + 28
/** Compass labels this close to the wind are hidden: the arrow and its figures are there. */
const LABEL_CLEARANCE_DEG = 25
/** Without an arrow (calm, variable, unknown), the wind's figures go under the compass. */
const STILL_WIND_Y = C + LETTER_R + 26

/** An airport before its runways are loaded: a chart symbol. */
const AIRPORT_R = 16

interface WindCompassProps {
  view: WindView
}

/**
 * The wind as a simple north-up graphic: a quiet compass ring, the aircraft on its heading
 * or the airport's runways (to scale, the one into the wind in green) in the middle, and
 * the wind: its side lit on the ring, and a bold arrow coming in from outside, as long as
 * the wind is strong, its direction and speed beside it. The aircraft's heading is a dotted
 * line to the ring; degrees every 30° around it.
 */
export function WindCompass(props: WindCompassProps) {
  const { view } = props
  const { scale, textScale } = useTheme()
  // As wide as the card allows (measured, as the sim's browser may not size an SVG by its
  // viewBox), up to a limit.
  const frameRef = useRef<HTMLDivElement>(null)
  const width = useElementSize(frameRef).width
  const size = Math.min(width, MAX_PX * scale)
  const turn = (deg: number) => `rotate(${deg} ${C} ${C})`

  // The longer the arrow, the stronger the wind.
  const reach = ARROW_MIN_REACH + (ARROW_TAIL_R - ARROW_MIN_REACH) * (view.strength ?? 0)
  const arrow = view.arrowDeg !== undefined && (
    <g transform={turn(view.arrowDeg)}>
      <line className={styles.arrowHalo} x1={C} y1={C - reach} x2={C} y2={ARROW_SHAFT_END} />
      <line className={styles.arrow} x1={C} y1={C - reach} x2={C} y2={ARROW_SHAFT_END} />
      <polygon className={styles.arrowHead} points={ARROW_HEAD_POINTS} />
    </g>
  )
  // The wind's figures: the direction above the arrow, the speed below; without an arrow,
  // on one line under the compass.
  const { direction, speed } = view.windText
  const spots =
    view.arrowDeg !== undefined &&
    arrowLabelSpots(
      view.arrowDeg,
      Math.max(reach - 4, FIGURES_MIN_R),
      { w: textWidthPx(direction, DIRECTION_FONT * textScale), h: FIGURE_H * textScale },
      { w: textWidthPx(speed ?? '', SPEED_FONT * textScale), h: FIGURE_H * textScale },
      FIGURE_GAP,
    )
  const figures = spots ? (
    <g>
      <text
        className={styles.windDirection}
        x={C + spots[0].x}
        y={C + spots[0].y + BASELINE}
        textAnchor="middle"
      >
        {direction}
      </text>
      <text
        className={styles.windSpeed}
        x={C + spots[1].x}
        y={C + spots[1].y + BASELINE}
        textAnchor="middle"
      >
        {speed}
      </text>
    </g>
  ) : (
    <text className={styles.windDirection} x={C} y={STILL_WIND_Y} textAnchor="middle">
      {speed ? `${direction} ${speed}` : direction}
    </text>
  )
  const labels =
    view.arrowDeg === undefined
      ? LABELS
      : LABELS.filter((l) => angleApart(l.deg, view.arrowDeg ?? 0) > LABEL_CLEARANCE_DEG)
  // The side the wind comes from, lit on the ring.
  const sector = view.arrowDeg !== undefined && (
    <path className={styles.sector} d={SECTOR} transform={turn(view.arrowDeg)} />
  )
  // The aircraft, and a dotted line from its nose to the ring: where it's heading.
  const aircraft = view.headingDeg !== undefined && (
    <g transform={turn(view.headingDeg)}>
      <line className={styles.headingLine} x1={C} y1={C - NOSE_R} x2={C} y2={C - RING_R + 4} />
      <path
        className={styles.aircraft}
        d={AIRCRAFT}
        transform={`translate(${C} ${C}) scale(${AIRCRAFT_SCALE})`}
      />
    </g>
  )
  const hasRunways = view.runways.length > 0
  const runways = hasRunways && (
    <g transform={`translate(${C} ${C})`}>
      {view.runways.map((rw) => (
        <Runway key={rw.key} runway={rw} />
      ))}
    </g>
  )
  const airportSymbol = view.center === 'airport' && !hasRunways && (
    <circle className={styles.airport} cx={C} cy={C} r={AIRPORT_R} />
  )

  const drawing = size > 0 && (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={styles.svg}
      aria-hidden="true"
    >
      <circle className={styles.disc} cx={C} cy={C} r={RING_R} />
      {TICKS.map((t) => (
        <line key={t.deg} className={styles.tick} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
      {labels.map((l) => (
        <text key={l.deg} className={styles[l.className]} x={l.x} y={l.y} textAnchor="middle">
          {l.text}
        </text>
      ))}
      {sector}
      {runways}
      {airportSymbol}
      {aircraft}
      {arrow}
      {figures}
    </svg>
  )

  return (
    <div ref={frameRef} className={styles.frame}>
      {drawing}
    </div>
  )
}

interface RunwayProps {
  /** Positions relative to the compass centre. */
  runway: RunwayShape
}

/** A runway end's label: green into the wind, yellow the flight plan's end, else quiet. */
const labelClass = (label: RunwayShape['labels'][number]) =>
  label.best ? 'runwayBest' : label.planned ? 'runwayLabelPlanned' : 'runwayLabel'

/**
 * A white runway seen from above, with its centre line and the number at each end (the
 * flight plan's in yellow, the one into the wind in green).
 */
function Runway(props: RunwayProps) {
  const { runway } = props
  const { x1, y1, x2, y2, labels } = runway

  return (
    <g>
      <line className={styles.runway} x1={x1} y1={y1} x2={x2} y2={y2} />
      <line className={styles.centreLine} x1={x1} y1={y1} x2={x2} y2={y2} />
      {labels.map((l) => (
        <text
          key={l.text}
          className={styles[labelClass(l)]}
          x={l.x}
          y={l.y + BASELINE}
          textAnchor="middle"
        >
          {l.text}
        </text>
      ))}
    </g>
  )
}
