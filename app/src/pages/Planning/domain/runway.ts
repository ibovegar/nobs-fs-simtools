// Geometry for the runway picture and the runway designator. Pure and unit-tested.
import type { TakeoffResult, TakeoffSpeeds } from './types'

/**
 * Field length includes a safety margin over the actual takeoff distance (to 35 ft at
 * V2); divide by this to place V2 on the runway picture.
 */
const FIELD_MARGIN = 1.15
/** Without a runway length, draw this much more runway than the estimated need. */
const UNKNOWN_RUNWAY_SLACK = 1.3
/**
 * Share of the takeoff distance flown in the air, from liftoff (≈ VR) to 35 ft at V2.
 * Typically a quarter for airliners and turboprops.
 */
const AIR_SEGMENT = 0.25

export interface RunwayMarks {
  /** Length of runway to draw (m). */
  runwayM: number
  /** True when the user entered the runway length (otherwise it's just a backdrop). */
  lengthKnown: boolean
  /** Distance from brake release (m) where each speed is reached. */
  v1M?: number
  vrM: number
  v2M: number
}

/**
 * Where V1, VR and V2 fall along the runway. V2 (at 35 ft) is at the estimated takeoff
 * distance; VR (≈ liftoff) where the ground roll ends, `AIR_SEGMENT` before it; V1 on the
 * ground roll, which with roughly constant acceleration grows with speed²:
 * d(V1) = d(VR) · (V1 / VR)². A picture of the estimate, not a performance figure.
 */
export function runwayMarks(
  speeds: TakeoffSpeeds,
  result: Pick<TakeoffResult, 'requiredRunwayM'>,
  runwayLengthM: number,
): RunwayMarks {
  const v2M = result.requiredRunwayM / FIELD_MARGIN
  const vrM = v2M * (1 - AIR_SEGMENT)
  const at = (v: number) => vrM * (v / speeds.vr) ** 2
  const lengthKnown = runwayLengthM > 0
  const runwayM = lengthKnown
    ? runwayLengthM
    : Math.max(800, Math.ceil((result.requiredRunwayM * UNKNOWN_RUNWAY_SLACK) / 100) * 100)
  return {
    runwayM,
    lengthKnown,
    v1M: speeds.v1 === undefined ? undefined : at(speeds.v1),
    vrM,
    v2M,
  }
}

export type RunwaySide = '' | 'L' | 'C' | 'R'

/** The runway number (1–36) a magnetic heading lines up with: 268° → 27, 004° → 36. */
export function runwayNumberFromHeading(magneticHeadingDeg: number): number {
  const n = Math.round((((magneticHeadingDeg % 360) + 360) % 360) / 10) % 36
  return n === 0 ? 36 : n
}

/** The other end's number: 27 → 9, 36 → 18, 18 → 36. */
export function reciprocalRunwayNumber(n: number): number {
  return ((n + 17) % 36) + 1
}

/** Left and right swap at the other end; centre stays centre. */
export function reciprocalSide(side: RunwaySide): RunwaySide {
  return side === 'L' ? 'R' : side === 'R' ? 'L' : side
}

/** "09L", "27", "36R" */
export function formatRunwayDesignator(n: number, side: RunwaySide = ''): string {
  return `${String(n).padStart(2, '0')}${side}`
}

/** Rows of labels above (speeds) and below (distances) the runway picture. */
const LABEL_ROWS = 3
/** A label goes in the first row whose last label is at least this far to the left (px). */
const LABEL_MIN_GAP_PX = 64
/** Lines closer than this (px) are merged into one ("V1/VR 118"). */
const MERGE_PX = 3

/** A speed line across the runway picture. */
export interface SpeedLine {
  key: string
  label: string
  speed: number
  distanceM: number
  tone: 'v1' | 'vr' | 'v2'
}

export interface PlacedLine extends SpeedLine {
  x: number
  /** 0 = labels next to the runway, then further out. */
  row: number
  text: string
}

/**
 * Lines at (almost) the same place merge into one label ("V1/VR 118", or "V1 117 / VR 118"
 * when the speeds differ); each label takes the first row with room for it.
 */
export function layoutLines(lines: readonly SpeedLine[], xAt: (m: number) => number): PlacedLine[] {
  const placed: PlacedLine[] = []
  /** x of the last label in each row. */
  const lastX: number[] = Array.from({ length: LABEL_ROWS }, () => Number.NEGATIVE_INFINITY)
  for (const l of lines) {
    const x = xAt(l.distanceM)
    const prev = placed[placed.length - 1]
    if (prev && Math.abs(x - prev.x) < MERGE_PX) {
      prev.text =
        prev.speed === l.speed
          ? `${prev.text.split(' ')[0]}/${l.label} ${l.speed}`
          : `${prev.text} / ${l.label} ${l.speed}`
      prev.tone = l.tone
      prev.distanceM = l.distanceM
      continue
    }
    const free = lastX.findIndex((last) => x - last >= LABEL_MIN_GAP_PX)
    const row = free === -1 ? LABEL_ROWS - 1 : free
    lastX[row] = x
    placed.push({ ...l, x, row, text: `${l.label} ${l.speed}` })
  }
  return placed
}
