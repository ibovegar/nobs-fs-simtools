// Climb, cruise, descent and approach figures for an aircraft, and the few sums the pages
// need from them. Pure and unit-tested. The figures come from the aircraft's own manual
// (Standard Day, ISA): see the comments in catalogue.ts.

/** One row of a climb or descent table: from / to sea level, at the table's speed. */
export interface ClimbRow {
  altitudeFt: number
  timeMin: number
  distanceNm: number
}

export interface AircraftPerformance {
  climb: {
    /** Climb speed (KIAS) the table is flown at. */
    speedKias: number
    /** Time and distance to climb from sea level, ascending by altitude. */
    table: readonly ClimbRow[]
  }
  cruise: {
    /** Typical true airspeed at normal cruise power (KTAS). */
    speedKtas: number
  }
  descent: {
    speedKias: number
    rateFpm: number
    /** Time and distance to descend to sea level, ascending by altitude. */
    table: readonly ClimbRow[]
  }
  approach: {
    /** Final approach speed (KIAS), landing flaps, at `atWeightKg`. */
    speedKias: number
    /** The weight the speed is for: the maximum landing weight. */
    atWeightKg: number
  }
}

/** The table's distance (and time) at an altitude: interpolated, scaled beyond its ends. */
function rowAt(table: readonly ClimbRow[], altitudeFt: number): ClimbRow | undefined {
  const first = table[0]
  const last = table[table.length - 1]
  if (!first || !last || altitudeFt <= 0) return undefined
  // Outside the table: same gradient (and rate) as the nearest end.
  const edge = altitudeFt <= first.altitudeFt ? first : altitudeFt >= last.altitudeFt ? last : null
  if (edge) {
    const k = altitudeFt / edge.altitudeFt
    return { altitudeFt, timeMin: edge.timeMin * k, distanceNm: edge.distanceNm * k }
  }
  const i = table.findIndex((r) => r.altitudeFt >= altitudeFt)
  const a = table[i - 1] as ClimbRow
  const b = table[i] as ClimbRow
  const t = (altitudeFt - a.altitudeFt) / (b.altitudeFt - a.altitudeFt)
  return {
    altitudeFt,
    timeMin: a.timeMin + t * (b.timeMin - a.timeMin),
    distanceNm: a.distanceNm + t * (b.distanceNm - a.distanceNm),
  }
}

/** Average climb gradient (ft per nm, still air) from sea level up to `altitudeFt`. */
export function climbGradientFtPerNm(perf: AircraftPerformance, altitudeFt: number) {
  const row = rowAt(perf.climb.table, altitudeFt)
  return row && row.distanceNm > 0 ? altitudeFt / row.distanceNm : undefined
}

/** Average climb rate (fpm) from sea level up to `altitudeFt`. */
export function climbRateFpm(perf: AircraftPerformance, altitudeFt: number) {
  const row = rowAt(perf.climb.table, altitudeFt)
  return row && row.timeMin > 0 ? altitudeFt / row.timeMin : undefined
}

/** Average descent gradient (ft per nm, still air) from `altitudeFt` down to sea level. */
export function descentGradientFtPerNm(perf: AircraftPerformance, altitudeFt: number) {
  const row = rowAt(perf.descent.table, altitudeFt)
  return row && row.distanceNm > 0 ? altitudeFt / row.distanceNm : undefined
}

/** Weights outside this share of the reference weight can't be right: no scaling then. */
const PLAUSIBLE_SHARE = [0.4, 1.2] as const

/**
 * Final approach speed at a weight: the speed scales with √(weight), as stall speed does.
 * Without a plausible weight, the speed at the maximum landing weight (the safe side).
 */
export function approachSpeedKias(perf: AircraftPerformance, weightKg: number | undefined) {
  const { speedKias, atWeightKg } = perf.approach
  if (weightKg === undefined) return speedKias
  const share = weightKg / atWeightKg
  if (share < PLAUSIBLE_SHARE[0] || share > PLAUSIBLE_SHARE[1]) return speedKias
  return Math.round(speedKias * Math.sqrt(share))
}
