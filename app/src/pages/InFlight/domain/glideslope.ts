// Where the aircraft is relative to a selected glideslope to a runway. Pure and unit-tested.
//
// Geometry: the slope crosses the threshold at THRESHOLD_CROSSING_HEIGHT_FT and meets the
// ground at the aim point just past it, like an ILS glideslope. Deviation is measured as an
// angle seen from that aim point and expressed in ILS "dots".

import { FEET_PER_NM } from './descentMath'

/** Height the glideslope crosses the runway threshold at (typical ILS TCH). */
export const THRESHOLD_CROSSING_HEIGHT_FT = 50

/** One dot on an ILS glideslope scale ≈ 0.35° (full scale, 2 dots, ≈ 0.7°). */
export const DOT_DEG = 0.35

/** Dots either side of centre on the scale. */
export const FULL_SCALE_DOTS = 2

/** Within this many dots counts as on slope. */
export const ON_SLOPE_DOTS = 0.5

export const GLIDESLOPE_ANGLES = [2.5, 3, 3.5, 4] as const

const tan = (deg: number) => Math.tan((deg * Math.PI) / 180)
const atanDeg = (x: number) => (Math.atan(x) * 180) / Math.PI

/** Distance from the threshold back to where the slope meets the ground (nm). */
export function aimPointOffsetNm(degrees: number): number {
  return THRESHOLD_CROSSING_HEIGHT_FT / tan(degrees) / FEET_PER_NM
}

/** Height above the runway the slope is at, this far from the threshold. */
export function glideslopeHeightFt(distanceNm: number, degrees: number): number {
  return (Math.max(0, distanceNm) + aimPointOffsetNm(degrees)) * FEET_PER_NM * tan(degrees)
}

export interface GlideslopeInputs {
  altitudeFt: number
  runwayElevationFt: number
  /** Distance to the runway threshold. */
  distanceNm: number
  degrees: number
}

export interface GlideslopePosition {
  distanceNm: number
  /** Aircraft height above the runway. */
  heightFt: number
  /** Height above the runway the slope is at here. */
  pathHeightFt: number
  /** Altitude (same reference as the input altitude) to be on slope here. */
  pathAltitudeFt: number
  /** Positive = above the slope. */
  deviationFt: number
  /** Positive = above the slope; unclamped (the scale clamps). */
  deviationDots: number
}

export function glideslopePosition(i: GlideslopeInputs): GlideslopePosition {
  const distanceNm = Math.max(0, i.distanceNm)
  const heightFt = i.altitudeFt - i.runwayElevationFt
  const pathHeightFt = glideslopeHeightFt(distanceNm, i.degrees)
  const fromAimPointFt = (distanceNm + aimPointOffsetNm(i.degrees)) * FEET_PER_NM
  const angleDeg = atanDeg(heightFt / fromAimPointFt)
  return {
    distanceNm,
    heightFt,
    pathHeightFt,
    pathAltitudeFt: i.runwayElevationFt + pathHeightFt,
    deviationFt: heightFt - pathHeightFt,
    deviationDots: (angleDeg - i.degrees) / DOT_DEG,
  }
}

export type SlopeState = 'on-slope' | 'high' | 'low' | 'well-high' | 'well-low'

export function slopeState(deviationDots: number): SlopeState {
  const off = Math.abs(deviationDots)
  if (off <= ON_SLOPE_DOTS) return 'on-slope'
  if (deviationDots > 0) return off > FULL_SCALE_DOTS ? 'well-high' : 'high'
  return off > FULL_SCALE_DOTS ? 'well-low' : 'low'
}

/** Distance ranges the profile view snaps to, so its scale doesn't jitter. */
const PROFILE_RANGES_NM = [2, 3, 4, 6, 8, 10, 15, 20] as const
const MAX_PROFILE_RANGE_NM = 30

/** Smallest range that shows the aircraft with some room behind it. */
export function profileRangeNm(distanceNm: number): number {
  const wanted = distanceNm * 1.2
  return PROFILE_RANGES_NM.find((r) => r >= wanted) ?? MAX_PROFILE_RANGE_NM
}

/** A distance mark under the glideslope side view. */
export interface DistanceTick {
  nm: number
  label: boolean
}

/** 1 nm ticks out to 10 nm (labelled every 1–2 nm), 5 nm ticks beyond. */
export function distanceTicks(rangeNm: number): DistanceTick[] {
  const step = rangeNm <= 10 ? 1 : 5
  const labelEvery = rangeNm <= 6 ? 1 : rangeNm <= 10 ? 2 : 5
  const ticks: DistanceTick[] = []
  for (let nm = 0; nm <= rangeNm; nm += step) ticks.push({ nm, label: nm % labelEvery === 0 })
  return ticks
}
