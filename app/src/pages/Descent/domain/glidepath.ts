// The 3° glidepath: which vertical speed holds it, and how the current descent compares.
// Pure and unit-tested.

import { FEET_PER_NM, MIN_GROUNDSPEED_KT, rateForAngle } from './descentMath'

/** The standard approach path angle. */
export const GLIDEPATH_DEG = 3

/** In-head rule of thumb: V/S ≈ groundspeed × 5 (exactly ≈ 5.3 for 3°). */
export const RULE_OF_THUMB_FACTOR = 5

/** How far off the target angle still counts as "on path". */
export const GLIDEPATH_TOLERANCE_DEG = 0.3

/** Slower than this (fpm, either way) counts as level flight. */
const LEVEL_FPM = 100

export type PathState = 'level' | 'shallow' | 'on-path' | 'steep'

/**
 * The angle the aircraft is descending at (positive = down), from groundspeed and vertical
 * speed. Null when too slow to mean anything (parked / taxiing).
 */
export function pathAngleDeg(groundSpeedKt: number, verticalSpeedFpm: number): number | null {
  if (groundSpeedKt < MIN_GROUNDSPEED_KT) return null
  const horizontalFpm = groundSpeedKt * (FEET_PER_NM / 60)
  return (Math.atan(-verticalSpeedFpm / horizontalFpm) * 180) / Math.PI
}

/** Compares the current descent with the target angle. */
export function pathState(
  angleDeg: number,
  verticalSpeedFpm: number,
  targetDeg = GLIDEPATH_DEG,
  toleranceDeg = GLIDEPATH_TOLERANCE_DEG,
): PathState {
  if (Math.abs(verticalSpeedFpm) < LEVEL_FPM || angleDeg <= 0) return 'level'
  if (angleDeg > targetDeg + toleranceDeg) return 'steep'
  if (angleDeg < targetDeg - toleranceDeg) return 'shallow'
  return 'on-path'
}

/** Typical approach groundspeeds for the reference table shown without sim data. */
export const GLIDEPATH_TABLE_SPEEDS = [90, 120, 140, 160, 180, 220] as const

export interface GlidepathRow {
  groundSpeedKt: number
  rateFpm: number
}

/** Vertical speed for the target angle at each groundspeed. */
export function glidepathTable(
  speeds: readonly number[] = GLIDEPATH_TABLE_SPEEDS,
  degrees = GLIDEPATH_DEG,
): GlidepathRow[] {
  return speeds.map((groundSpeedKt) => ({
    groundSpeedKt,
    rateFpm: rateForAngle(groundSpeedKt, degrees),
  }))
}
