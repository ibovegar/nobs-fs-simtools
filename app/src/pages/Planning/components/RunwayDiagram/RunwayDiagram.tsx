import { useElementSize, useTheme } from '@nobs/ui'
import { useRef } from 'react'
import {
  formatInteger,
  formatRunwayDesignator,
  layoutLines,
  type RunwayMarks,
  reciprocalRunwayNumber,
  type SpeedLine,
  type TakeoffSpeeds,
} from '~/pages/Planning/domain'
import styles from './RunwayDiagram.module.css'

/** Layout in px. No side padding: the runway spans the full width, like the controls. */
const PAD_X = 0
const RUNWAY_H = 46
/**
 * Up to three rows of labels above the runway (speeds) and below it (distances); only the
 * rows in use take space.
 */
const ROW_H = 14
/** Threshold markings + painted number + aircraft before the brake release point. */
const THRESHOLD_PX = 64
/** Labels end just left of their line, so lines further right never cross them. */
const LABEL_OFFSET_PX = 4
/** Space after the end of the runway for a V2 point that lies beyond it. */
const OVERRUN_PX = 26

interface RunwayDiagramProps {
  marks: RunwayMarks
  speeds: TakeoffSpeeds
  /** Runway number 1–36, from the heading; undefined when unknown (no number painted). */
  runwayNumber: number | undefined
  /** Single-engine aircraft: VR and the 50 ft speed, no V1. */
  single: boolean
}

/**
 * The runway from above, takeoff to the right: the aircraft lined up at the threshold
 * behind the painted runway number, and lines across the runway where V1, VR and V2 are
 * reached (estimated). A V2 point past the end of the runway shows in red beyond it.
 */
export function RunwayDiagram(props: RunwayDiagramProps) {
  const { marks, speeds, runwayNumber, single } = props

  const ref = useRef<HTMLDivElement>(null)
  const { scale } = useTheme()
  // Drawn in unscaled px: the viewBox enlarges the drawing with the UI scale.
  const width = useElementSize(ref).width / scale

  const lines: SpeedLine[] = [
    ...(speeds.v1 !== undefined && marks.v1M !== undefined
      ? [{ key: 'v1', label: 'V1', speed: speeds.v1, distanceM: marks.v1M, tone: 'v1' as const }]
      : []),
    { key: 'vr', label: 'VR', speed: speeds.vr, distanceM: marks.vrM, tone: 'vr' },
    {
      key: 'v2',
      label: single ? '50 ft' : 'V2',
      speed: speeds.v2,
      distanceM: marks.v2M,
      tone: 'v2',
    },
  ]

  const overrun = marks.v2M > marks.runwayM
  const startX = PAD_X
  const releaseX = startX + THRESHOLD_PX
  const endX = width - PAD_X - (overrun ? OVERRUN_PX : 0)
  // Brake release to the far end of the runway; anything beyond is clamped into the overrun.
  const pxPerM = Math.max(0, endX - releaseX) / marks.runwayM
  const xAt = (m: number) => Math.min(releaseX + m * pxPerM, width - PAD_X)

  const placed = layoutLines(lines, xAt)
  const rowsUsed = Math.max(1, ...placed.map((l) => l.row + 1))
  const labelH = rowsUsed * ROW_H + 8
  const height = RUNWAY_H + 2 * labelH
  const top = labelH
  const bottom = top + RUNWAY_H
  const mid = top + RUNWAY_H / 2

  const designator = runwayNumber === undefined ? undefined : formatRunwayDesignator(runwayNumber)
  const farDesignator =
    runwayNumber === undefined
      ? undefined
      : formatRunwayDesignator(reciprocalRunwayNumber(runwayNumber))

  return (
    <div ref={ref} className={styles.diagram}>
      {width > 0 && (
        <svg
          width={width * scale}
          height={height * scale}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
          aria-hidden="true"
        >
          <rect
            className={styles.runway}
            x={startX}
            y={top}
            width={endX - startX}
            height={RUNWAY_H}
          />
          {!marks.lengthKnown && (
            // Unknown length: fade out the far end instead of drawing a hard edge.
            <rect className={styles.fade} x={endX - 40} y={top} width={40} height={RUNWAY_H} />
          )}

          {/* Threshold "piano keys" at both ends. */}
          <ThresholdKeys x={startX + 3} top={top} />
          {marks.lengthKnown && <ThresholdKeys x={endX - 9} top={top} />}

          {/* Centreline from brake release to the far end. */}
          <line
            className={styles.centreline}
            x1={releaseX + 6}
            y1={mid}
            x2={endX - (designator ? 40 : 12)}
            y2={mid}
          />

          {/* Runway numbers, painted to read in the direction of travel. */}
          {designator && (
            <text
              className={styles.number}
              x={startX + 22}
              y={mid}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(90 ${startX + 22} ${mid})`}
            >
              {designator}
            </text>
          )}
          {farDesignator && marks.lengthKnown && (
            <text
              className={styles.number}
              x={endX - 26}
              y={mid}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(-90 ${endX - 26} ${mid})`}
            >
              {farDesignator}
            </text>
          )}

          {placed.map((l) => {
            const beyond = l.distanceM > marks.runwayM
            return (
              <g key={l.key} className={beyond ? styles.beyond : styles[l.tone]}>
                <line
                  className={styles.speedLine}
                  x1={l.x}
                  y1={top - 4 - l.row * ROW_H}
                  x2={l.x}
                  y2={bottom + 4 + l.row * ROW_H}
                />
                <text
                  className={styles.speedLabel}
                  x={l.x - LABEL_OFFSET_PX}
                  y={top - 8 - l.row * ROW_H}
                  textAnchor="end"
                >
                  {l.text}
                </text>
                <text
                  className={styles.distance}
                  x={l.x - LABEL_OFFSET_PX}
                  y={bottom + 16 + l.row * ROW_H}
                  textAnchor="end"
                >
                  {`${formatInteger(l.distanceM)} m`}
                </text>
              </g>
            )
          })}

          {/* Nose just short of the brake release point. */}
          <Aircraft x={releaseX - 15} y={mid} />
        </svg>
      )}
    </div>
  )
}

/** Six white bars across the runway at a threshold. */
function ThresholdKeys(props: { x: number; top: number }) {
  const { x, top } = props
  const bars = [0, 1, 2, 3, 4, 5]
  const step = RUNWAY_H / bars.length
  return (
    <g>
      {bars.map((i) => (
        <rect
          key={i}
          className={styles.marking}
          x={x}
          y={top + i * step + step * 0.25}
          width={6}
          height={step * 0.5}
        />
      ))}
    </g>
  )
}

/** An airliner from above, nose to the right, centred on (x, y). */
function Aircraft(props: { x: number; y: number }) {
  const { x, y } = props
  // Half outline (nose → tail along the top), mirrored for the bottom.
  const half: [number, number][] = [
    [14, 0],
    [10, -2],
    [3, -2],
    [-3, -13],
    [-7, -13],
    [-4, -2],
    [-11, -2],
    [-15, -7],
    [-17, -7],
    [-15, 0],
  ]
  const points = [
    ...half,
    ...half
      .slice(0, -1)
      .reverse()
      .map(([px, py]) => [px, -py] as const),
  ]
    .map(([px, py]) => `${x + px},${y + py}`)
    .join(' ')
  return <polygon className={styles.aircraft} points={points} />
}
